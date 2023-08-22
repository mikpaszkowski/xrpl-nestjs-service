import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import {
  AccountObjectsRequest,
  AccountObjectsResponse,
  SubmitResponse,
  URITokenBurn,
  URITokenMint,
} from '@transia/xrpl';
import { MintURITokenInputDTO } from './dto/uri-token-input.dto';
import * as process from 'process';
import { Account } from '../account/interfaces/account.interface';
import HookState from '@transia/xrpl/dist/npm/models/ledger/URIToken';
import { UriTokenMapper } from './mapper/uri-token.mapper';
import { URITokenOutputDTO } from './dto/uri-token-output.dto';

@Injectable()
export class URITokenService {
  constructor(private readonly xrpl: XrplService) {}

  async mintURIToken(input: MintURITokenInputDTO): Promise<SubmitResponse> {
    const tx: URITokenMint = {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID || '21338'),
      TransactionType: 'URITokenMint',
      URI: input.uri,
    };
    return this.xrpl.submitTransaction(tx, input.account);
  }

  async getAccountTokens(account: string): Promise<URITokenOutputDTO[]> {
    const tokenReq = {
      command: 'account_objects',
      account: account,
      ledger_index: 'validated',
      type: 'uri_token',
      limit: 10,
    };
    const response = await this.xrpl.submitRequest<AccountObjectsRequest, AccountObjectsResponse>(
      tokenReq as AccountObjectsRequest
    );
    return response.result.account_objects.map((ledgerObj: HookState) =>
      UriTokenMapper.mapUriTokenToDto(ledgerObj as unknown as HookState & { Flags: number })
    );
  }

  async findToken(address: string, index: string): Promise<URITokenOutputDTO | null> {
    const accountTokens = await this.getAccountTokens(address);
    return accountTokens.find((item) => item.index === index) || null;
  }

  async removeURIToken(account: Account, index: string): Promise<SubmitResponse> {
    const tx: URITokenBurn = {
      Account: account.address,
      NetworkID: parseInt(process.env.NETWORK_ID || '21338'),
      TransactionType: 'URITokenBurn',
      URITokenID: index,
    };
    return this.xrpl.submitTransaction(tx, account);
  }
}
