import { URITokenOutputDTO } from '../dto/uri-token-output.dto';
import { URIToken } from '@transia/xrpl/dist/npm/models/ledger';

export const UriTokenMapper = {
  mapUriTokenToDto: (ledgerObj: URIToken & { Flags: number }): URITokenOutputDTO => {
    return {
      index: ledgerObj.index,
      uri: ledgerObj.URI,
      owner: ledgerObj.Owner,
      issuer: ledgerObj.Issuer,
      destination: ledgerObj.Destination,
      amount: ledgerObj.Amount,
      digest: ledgerObj.Digest,
      flags: ledgerObj.Flags || 0,
    } as URITokenOutputDTO;
  },
};
