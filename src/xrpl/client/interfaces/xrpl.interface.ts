import { XRPL_Account } from 'xrpl-accountlib';
import { BaseTransaction } from '@transia/xrpl/dist/npm/models/transactions/common';

export enum XRPL_RESULT_PREFIX {
  MALFORMED = 'tem',
  RETRY = 'ter',
  SUCCESS = 'tes',
  CLAIMED_COST_ONLY = 'tec',
}

export enum XRPL_RESPONSE_CODE {
  SUCCESS = 'tesSUCCESS',
  HOOK_REJECTED = 'tecHOOK_REJECTED',
}

export interface IResultCode {
  prefix: string;
  code: string;
}

export interface ICompleteXrplTx<T extends BaseTransaction> {
  authorizedAccount: XRPL_Account;
  newTx: T;
}
