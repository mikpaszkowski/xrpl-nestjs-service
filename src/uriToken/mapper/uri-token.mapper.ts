import HookState from '@transia/xrpl/dist/npm/models/ledger/URIToken';
import { URITokenOutputDTO } from '../dto/uri-token-output.dto';

export const UriTokenMapper = {
  mapUriTokenToDto: (ledgerObj: HookState) => {
    return {
      index: ledgerObj.index,
      uri: ledgerObj.URI,
      owner: ledgerObj.Owner,
      issuer: ledgerObj.Issuer,
      destination: ledgerObj.Destination,
      amount: ledgerObj.Amount,
      digest: ledgerObj.Digest,
    } as URITokenOutputDTO;
  },
};
