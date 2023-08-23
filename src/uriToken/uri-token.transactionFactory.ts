import { MintURITokenInputDTO } from './dto/uri-token-input.dto';
import { URITokenBurn, URITokenMint } from '@transia/xrpl';
import * as process from 'process';
import { Account } from '../account/interfaces/account.interface';

export class UriTokenTransactionFactory {
  static prepareURITokenMintTx(input: MintURITokenInputDTO): URITokenMint {
    return {
      Account: input.account.address,
      NetworkID: parseInt(process.env.NETWORK_ID || '21338'),
      TransactionType: 'URITokenMint',
      URI: input.uri,
    };
  }
  static prepareURITokenBurnTx(account: Account, index: string): URITokenBurn {
    return {
      Account: account.address,
      NetworkID: parseInt(process.env.NETWORK_ID || '21338'),
      TransactionType: 'URITokenBurn',
      URITokenID: index,
    };
  }
}
