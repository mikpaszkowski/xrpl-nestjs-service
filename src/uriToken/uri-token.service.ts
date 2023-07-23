import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { AccountObjectsRequest, AccountObjectsResponse, SubmitResponse, URITokenMint } from '@transia/xrpl';
import { MintURITokenInputDTO } from './dto/uri-token-input.dto';
import * as process from 'process';

@Injectable()
export class UriTokenService {
  constructor(private readonly xrpl: XrplService) {}

  async mintURIToken(input: MintURITokenInputDTO): Promise<SubmitResponse> {
    const tx: URITokenMint = {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenMint',
      URI: input.uri,
    };
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async getAccountTokens(account: string): Promise<AccountObjectsResponse> {
    const tokenReq = {
      command: 'account_objects',
      account: account,
      ledger_index: 'validated',
      type: 'uri_token',
      limit: 10,
    };
    return await this.xrpl.submitRequest<AccountObjectsRequest, AccountObjectsResponse>(
      tokenReq as AccountObjectsRequest
    );
  }
}
