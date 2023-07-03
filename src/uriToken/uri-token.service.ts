import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { SubmitResponse, URITokenMint } from '@transia/xrpl';
import { IAccountInfo } from '../xrpl/client/interfaces/account-info.interface';
import { MintURITokenInputDTO } from './dto/uri-token-input.dto';
import * as process from 'process';

@Injectable()
export class UriTokenService {
  constructor(private readonly xrpl: XrplService) {}

  async mintURIToken(input: MintURITokenInputDTO): Promise<SubmitResponse> {
    const response: IAccountInfo = await this.xrpl.getAccountBasicInfo(input.account.address);

    const tx: URITokenMint = {
      Account: input.account.address,
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      TransactionType: 'URITokenMint',
      URI: input.uri,
    };
    return this.xrpl.submitTransaction(tx, input.account);
  }
}
