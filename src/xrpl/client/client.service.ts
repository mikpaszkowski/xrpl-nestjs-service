import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client, SubmitResponse, Transaction, Wallet } from '@transia/xrpl';
import { IAccount } from '../../hooks/interfaces/account.interface';
import { IAccountInfo } from './interfaces/account-info.interface';

@Injectable()
export class XrplService implements OnModuleInit, OnModuleDestroy {
  private readonly client = new Client('wss://hooks-testnet-v3.xrpl-labs.com');

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  async submitTransaction(tx: Transaction, account: IAccount): Promise<SubmitResponse> {
    const wallet = Wallet.fromSeed(account.secret);

    const signedTxBeforeFee = wallet.sign(tx);

    const feeResponse = await this.client.request({ command: 'fee', tx_blob: signedTxBeforeFee.tx_blob });
    console.log(feeResponse?.result.drops);

    tx['Fee'] = feeResponse?.result?.drops?.base_fee || '1000';
    const prepared_tx = await this.client.autofill(tx as Transaction);

    const signedTxNew = wallet.sign(prepared_tx);

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

  async getAccountInfo(accountNumber: string): Promise<IAccountInfo> {
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
}
