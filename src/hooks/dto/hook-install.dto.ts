import { HookParameter } from '@transia/xrpl/dist/npm/models/common';

export class HookInstallOutputDTO {
  result: string;
  tx_hash: string;
}

export class HookInstallInputDTO {
  readonly accountNumber: string;
  readonly seed: string;
  readonly grantedAccounts?: string[];
  readonly parameters?: HookParameter[];
}
