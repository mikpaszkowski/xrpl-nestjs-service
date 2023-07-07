import { HookGrant } from '@transia/xrpl/dist/npm/models/common';

export class HookInstallOutputDTO {
  result: string;
  tx_hash: string;
}

export class HookDeployInputDTO {
  readonly accountNumber: string;
  readonly seed: string;
  readonly grants?: HookGrant[];
}

export class HookRemoveInputDTO {
  readonly accountNumber: string;
  readonly seed: string;
}

export class HookResetInputDTO {
  readonly accountNumber: string;
  readonly seed: string;
  readonly namespace: string;
}
