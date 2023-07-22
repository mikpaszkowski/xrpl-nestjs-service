import { AccountInfoResponse } from '@transia/xrpl';
import { IAccountInfoOutputDto } from '../interfaces/account.interface';

export const AccountMapper = {
  accountInfoResponseToDto: (accountInfoResponse: AccountInfoResponse): IAccountInfoOutputDto => {
    return {
      flags: accountInfoResponse.result.account_data.Flags,
      address: accountInfoResponse.result.account_data.Account,
      balance: accountInfoResponse.result.account_data.Balance,
      hookNamespaces: accountInfoResponse.result.account_data['HookNamespaces'] || [],
      numOfHookStateData: accountInfoResponse.result.account_data['HookStateCount'] || 0,
      validated: accountInfoResponse.result.validated,
    };
  },
};
