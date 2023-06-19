export class HookInstallOutputDTO {
  result: string;
  tx_hash: string;
}

export class HookInstallInputDTO {
  readonly accountNumber: string;
  readonly seed: string;
}
