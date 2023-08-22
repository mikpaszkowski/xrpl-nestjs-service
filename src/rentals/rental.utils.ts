import { HookParameter } from '@transia/xrpl/dist/npm/models/common';
import { floatToLEXfl, iHookParamEntry, iHookParamName, iHookParamValue } from '@transia/hooks-toolkit';
import { BaseRentalInfo } from './dto/rental.dto';
import { AccountID } from '@transia/ripple-binary-codec/dist/types';

type IRentalContextData = Omit<BaseRentalInfo, 'rentalType'>;

export function getRentalContextHookParams(input: IRentalContextData): HookParameter[] {
  return [
    new iHookParamEntry(
      new iHookParamName('RENTALAMOUNT', false),
      new iHookParamValue(floatToLEXfl(input.totalAmount.toString()), true)
    ).toXrpl(),
    new iHookParamEntry(
      new iHookParamName('RENTALDEADLINE', false),
      new iHookParamValue(floatToLEXfl((Date.parse(input.deadline) / 1000).toString()), true)
    ).toXrpl(),
  ];
}

export function getForeignAccountTxParams(destination: string, hookNamespace: string) {
  return [
    new iHookParamEntry(
      new iHookParamName('FOREIGNACC'),
      new iHookParamValue(AccountID.from(destination).toHex(), true)
    ).toXrpl(),
    new iHookParamEntry(new iHookParamName('FOREIGNNS'), new iHookParamValue(hookNamespace, true)).toXrpl(),
  ];
}
