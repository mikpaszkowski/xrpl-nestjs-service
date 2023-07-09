import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AccountInfoRequest, Client, SubmitResponse, Transaction, Wallet } from '@transia/xrpl';
import { IAccount } from '../../account/interfaces/account.interface';
import { IAccountInfo } from './interfaces/account-info.interface';
import * as process from 'process';
import { BaseRequest, BaseResponse } from '@transia/xrpl/dist/npm/models/methods/baseMethod';

@Injectable()
export class XrplService implements OnModuleInit, OnModuleDestroy {
  private readonly client = new Client(process.env.SERVER_API_ENDPOINT);

  public getClient(): Client {
    return this.client;
  }

  async onModuleInit() {
    console.log('Connecting to XRPL Client ...');
    await this.client.connect();
  }

  async onModuleDestroy() {
    console.log('Disconnecting to XRPL Client ...');
    await this.client.disconnect();
  }

  async submitTransaction(tx: Transaction, account: IAccount): Promise<SubmitResponse> {
    const wallet = Wallet.fromSeed(account.secret);

    const signedTxBeforeFee = wallet.sign(tx);
    const feeResponse = await this.client.request({ command: 'fee', tx_blob: signedTxBeforeFee.tx_blob });

    tx['Fee'] = feeResponse?.result?.drops?.base_fee || '1000';
    const signedTxNew = wallet.sign(tx);
    let submitRes;
    try {
      submitRes = await this.client.submit(signedTxNew.tx_blob);
      if (submitRes.engine_result === 'tesSUCCESS') {
        console.log('Success');
      } else {
        console.log('Error transaction submission');
      }
    } catch (err) {
      console.error(err);
    }
    console.log(submitRes);
    return submitRes;
  }

  async getAccountBasicInfo(accountNumber: string): Promise<IAccountInfo> {
    const response = await this.client.request({
      command: 'account_info',
      account: accountNumber,
      ledger_index: 'validated',
    });
    const { Account, Sequence, Flags, Balance } = response.result.account_data;
    return {
      Account,
      Balance,
      Flags,
      Sequence,
    };
  }

  async getAccountInfo(accountNumber: string) {
    const accountInfoReq: AccountInfoRequest = {
      command: 'account_info',
      account: accountNumber,
      ledger_index: 'validated',
    };
    return await this.submitRequest(accountInfoReq);
  }

  async getAccountNamespace(accountNumber: string, namespace: string) {
    const accountNSReq = {
      command: 'account_namespace',
      account: accountNumber,
      namespace_id: namespace,
    };
    return await this.submitRequest(accountNSReq);
  }

  async submitRequest<T extends BaseRequest, K extends BaseResponse>(requestInput: T): Promise<K> {
    return await this.client.request<T, K>(requestInput);
  }
}
