import {
  BadGatewayException,
  ConflictException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AccountInfoRequest,
  AccountInfoResponse,
  Client,
  ConnectionError,
  NotConnectedError,
  NotFoundError,
  RippledError,
  SubmitResponse,
  Transaction,
  ValidationError,
} from '@transia/xrpl';
import { Account } from '../../account/interfaces/account.interface';
import { IAccountInfo } from './interfaces/account-info.interface';
import * as process from 'process';
import { BaseRequest, BaseResponse } from '@transia/xrpl/dist/npm/models/methods/baseMethod';
import {
  DisconnectedError,
  ResponseFormatError,
  RippledNotInitializedError,
  TimeoutError,
  UnexpectedError,
} from '@transia/xrpl/dist/npm/errors';
import { derive, signAndSubmit, utils, XRPL_Account, XrplClient } from 'xrpl-accountlib';
import { BaseTransaction } from '@transia/xrpl/dist/npm/models/transactions/common';
import { IHookNamespaceInfo } from './interfaces/namespace.interface';

@Injectable()
export class XrplService implements OnModuleInit, OnModuleDestroy {
  private readonly TX_REJECTED_BY_HOOK_CODE = 'tecHOOK_REJECTED';

  private readonly client = new Client(process.env.SERVER_API_ENDPOINT);
  private readonly xrpl_client = new XrplClient(process.env.SERVER_API_ENDPOINT);

  public getClient(): Client {
    return this.client;
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      await this.xrpl_client.ready();
      Logger.log('Connected to XRPL client with success');
    } catch (err) {
      Logger.error(`Connection to XRPL client failed: ${err.data.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.disconnect();
      this.xrpl_client.close();
    } catch (err) {
      Logger.log('Disconnecting to XRPL Client ...');
    }
  }

  async submitTransaction(tx: Transaction, account: Account): Promise<SubmitResponse> {
    let submitRes;
    try {
      const { authorizedAccount, newTx } = await this.fillTxWithAdditionalInfo(account, tx);
      submitRes = await signAndSubmit(newTx, this.xrpl_client, authorizedAccount);
    } catch (err) {
      throw new ServiceUnavailableException(`Transaction submission failure: ${err?.message}`);
    }
    this.handleResponse(submitRes, tx);
    return submitRes;
  }

  private handleResponse<T extends BaseTransaction>(submitRes, tx: T) {
    const formattedCode = this.formatResultCode(submitRes);
    if (formattedCode.prefix === XRPL_RESULT_PREFIX.SUCCESS.valueOf()) {
      Logger.log(`Transaction: ${tx.TransactionType} submitted successfully`);
    } else if (formattedCode.prefix === XRPL_RESULT_PREFIX.MALFORMED.valueOf()) {
      Logger.error(`Transaction: ${tx.TransactionType} is not valid: ${submitRes.response.engine_result}`);
      throw new UnprocessableEntityException(`Transaction: ${tx.TransactionType} is not valid`);
    } else if (formattedCode.prefix === XRPL_RESULT_PREFIX.RETRY) {
      Logger.error(
        `Transaction: ${tx.TransactionType} could not be applied, retry: ${submitRes.response.engine_result}`
      );
      throw new UnprocessableEntityException(`Transaction: ${tx.TransactionType} could not be applied, retry.`);
    } else if (formattedCode.code === this.TX_REJECTED_BY_HOOK_CODE) {
      Logger.error(`Transaction: ${tx.TransactionType} was rejected by the hook: ${submitRes.response.engine_result}`);
      throw new ConflictException(`Transaction: ${tx.TransactionType} rejected by the hook`);
    } else {
      Logger.error(`Transaction: ${tx.TransactionType} submission failed: ${submitRes.response.engine_result}`);
      throw new ServiceUnavailableException(`Transaction: ${tx.TransactionType} submission failed`);
    }
  }

  private formatResultCode(submitRes): { code: string; prefix: string } {
    return {
      prefix: submitRes.response.engine_result.slice(0, 3),
      code: submitRes.response.engine_result,
    };
  }

  private async fillTxWithAdditionalInfo<T extends BaseTransaction>(
    account: Account,
    tx: T
  ): Promise<{ authorizedAccount: XRPL_Account; newTx: T }> {
    const authorizedAccount = this.getAuthorizedAccount(account.secret);
    try {
      const networkInfo = await utils.txNetworkAndAccountValues(this.xrpl_client, authorizedAccount);
      Logger.log(networkInfo);
      const newTx: T = {
        ...tx,
        ...networkInfo.txValues,
      };
      return { authorizedAccount, newTx };
    } catch (err) {
      Logger.error(`Failure in retrieving additional info for transaction: ${err.message}`);
      throw new Error('Failure in retrieving additional info for transaction');
    }
  }

  private getAuthorizedAccount(secret: string): XRPL_Account {
    try {
      return derive.familySeed(secret);
    } catch (err) {
      throw new Error('Invalid account info');
    }
  }

  async getAccountInfo(accountNumber: string): Promise<AccountInfoResponse> {
    const accountInfoReq: AccountInfoRequest = {
      command: 'account_info',
      account: accountNumber,
      ledger_index: 'validated',
    };
    return await this.submitRequest<AccountInfoRequest, AccountInfoResponse>(accountInfoReq);
  }

  async getAccountNamespace(accountNumber: string, namespace: string): Promise<IHookNamespaceInfo> {
    const accountNSReq = {
      command: 'account_namespace',
      account: accountNumber,
      namespace_id: namespace,
    };
    return await this.submitRequest<any, IHookNamespaceInfo>(accountNSReq);
  }

  async submitRequest<T extends BaseRequest, K extends BaseResponse>(requestInput: T): Promise<K> {
    try {
      return await this.client.request<T, K>(requestInput);
    } catch (err) {
      if (XRPL_INTERNAL_ERRORS.includes(err.name)) {
        throw new NotFoundException(
          `XRPL resource: ${requestInput.command} not found: ${err?.message} Failure result code: ${err.data.error_code}`
        );
      } else if (CONNECTION_ERRORS.includes(err.name)) {
        throw new BadGatewayException(`XRPL network is not available: ${err.data.message}`);
      } else if (err.name === TimeoutError.name) {
        throw new GatewayTimeoutException();
      } else if (err.name === ValidationError.name) {
        throw new UnprocessableEntityException(
          `Request to XRPL network be cannot be validated to retrieve: ${requestInput.command} failed with code: ${err.data.error_code}`
        );
      }
    }
  }
}

const CONNECTION_ERRORS: string[] = [
  NotConnectedError.name,
  DisconnectedError.name,
  RippledNotInitializedError.name,
  ResponseFormatError.name,
  ConnectionError.name,
  UnexpectedError.name,
];

const XRPL_INTERNAL_ERRORS: string[] = [NotFoundError.name, RippledError.name];

enum XRPL_RESULT_PREFIX {
  MALFORMED = 'tem',
  RETRY = 'ter',
  SUCCESS = 'tes',
}
