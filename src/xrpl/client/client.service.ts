import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client, LedgerEntryRequest, SubmitResponse, Transaction, Wallet } from '@transia/xrpl';
import { IAccount } from '../../account/interfaces/account.interface';
import { IAccountInfo } from './interfaces/account-info.interface';
import * as process from 'process';

@Injectable()
export class XrplService implements OnModuleInit, OnModuleDestroy {
  private readonly client = new Client(process.env.SERVER_API_ENDPOINT);

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  async submitTransaction(tx: Transaction, account: IAccount): Promise<SubmitResponse> {
    const wallet = Wallet.fromSeed(account.secret);
    console.log(JSON.stringify(tx));

    const signedTxBeforeFee = wallet.sign(tx);

    const feeResponse = await this.client.request({ command: 'fee', tx_blob: signedTxBeforeFee.tx_blob });
    console.log(feeResponse?.result.drops);

    tx['Fee'] = feeResponse?.result?.drops?.base_fee || '1000';
    const prepared_tx = await this.client.autofill(tx as Transaction);

    const signedTxNew = wallet.sign(prepared_tx);
    console.log(JSON.stringify(prepared_tx));
    let submitRes;
    try {
      submitRes = await this.client.submit(signedTxNew.tx_blob);
      if (submitRes.engine_result === 'tesSUCCESS') {
        console.log('Success');
      } else {
        console.log('Error in hook deployment');
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
    return await this.client.request({
      command: 'account_info',
      account: accountNumber,
    });
  }

  async getAccountNamespace(accountNumber: string, namespace: string) {
    return await this.client.request({
      command: 'account_namespace',
      account: accountNumber,
      namespace_id: namespace,
    });
  }

  async getAccountHooks(account: string) {
    const hookReq: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook: {
        account: account,
      },
    };
    console.log(hookReq);
    return await this.client.request(hookReq);
  }
}
