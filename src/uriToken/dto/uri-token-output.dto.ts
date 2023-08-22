export class XRPLBaseResponseDTO {
  result: string;
  tx_hash: string;
}

export class URITokenOutputDTO {
  index: string;
  uri: string;
  owner: string;
  issuer: string;
  destination: string;
  amount: string;
  digest: string;
  flags: number;
}
