import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Client, SubmitResponse, Transaction } from '@transia/xrpl';
import { Account } from '../../account/interfaces/account.interface';
import * as process from 'process';
import { BaseRequest, BaseResponse } from '@transia/xrpl/dist/npm/models/methods/baseMethod';
import { derive, signAndSubmit, utils, XRPL_Account, XrplClient } from 'xrpl-accountlib';
import { BaseTransaction } from '@transia/xrpl/dist/npm/models/transactions/common';
import { IHookNamespaceInfo } from './interfaces/namespace.interface';
import { ICompleteXrplTx } from './interfaces/xrpl.interface';
import { ClientErrorhandler } from './client.error.handler';

@Injectable()
export class XrplService {
  private readonly client = new Client(process.env.SERVER_API_ENDPOINT || 'wss://hooks-testnet-v3.xrpl-labs.com');
  private readonly xrpl_client = new XrplClient(
    process.env.SERVER_API_ENDPOINT || 'wss://hooks-testnet-v3.xrpl-labs.com'
  );

  async submitRequest<T extends BaseRequest, K extends BaseResponse>(requestInput: T): Promise<K> {
    Logger.log(`Request to XRPL: ${requestInput.command} fired`);
    try {
      const response = await (await this.getClient()).request<T, K>(requestInput);
      Logger.log(`Request to XRPL: ${requestInput.command} passed successfully`);
      return response;
    } catch (err) {
      ClientErrorhandler.handleRequestError<T>(err, requestInput);
    }
  }

  async submitTransaction(tx: Transaction, account: Account): Promise<SubmitResponse> {
    Logger.log(`Submission of transaction: ${tx.TransactionType} has started`);
    let submitRes;
    try {
      const { authorizedAccount, newTx } = await this.fillTxWithAdditionalInfo(account, tx);
      submitRes = await signAndSubmit(newTx, this.xrpl_client, authorizedAccount);
    } catch (err) {
      Logger.error(err);
      throw new ServiceUnavailableException(`Transaction submission failure: ${err?.message}`);
    }
    ClientErrorhandler.handleResponse(submitRes, tx);
    Logger.log(`Submission of transaction: ${tx.TransactionType} has been submitted successfully`);
    return submitRes;
  }

  public async getClient(): Promise<Client> {
    await this.client.connect();
    return this.client;
  }

  async getAccountNamespace(accountNumber: string, namespace: string): Promise<IHookNamespaceInfo> {
    const accountNSReq = {
      command: 'account_namespace',
      account: accountNumber,
      namespace_id: namespace,
    };
    return await this.submitRequest<any, IHookNamespaceInfo>(accountNSReq);
  }

  private async fillTxWithAdditionalInfo<T extends BaseTransaction>(
    account: Account,
    tx: T
  ): Promise<ICompleteXrplTx<T>> {
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
}
