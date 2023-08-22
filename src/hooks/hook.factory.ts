import { SetHook, SetHookFlags } from '@transia/xrpl';
import * as process from 'process';
import { Hook, HookGrant } from '@transia/xrpl/dist/npm/models/common';
import { HOOK_ON, SetHookType } from './hook.constants';
import { readFileSync } from 'fs';

export interface ISetHookPrepareInput {
  type: SetHookType;
  account: string;
  hookNamespace?: string;
  grants?: HookGrant[];
}

export class HookTransactionFactory {
  static prepareSetHookTx(input: ISetHookPrepareInput): SetHook {
    const tx_basic: SetHook = {
      Account: input.account,
      TransactionType: 'SetHook',
      NetworkID: parseInt(process.env.NETWORK_ID || '21338'),
      Hooks: [],
    };

    let hook_basic: Hook = {
      Hook: {
        ...(input.hookNamespace && { HookNamespace: input.hookNamespace }),
        ...(input.grants && { HookGrants: input.grants }),
      },
    };
    switch (input.type) {
      case SetHookType.INSTALL:
        hook_basic = {
          Hook: {
            ...hook_basic.Hook,
            CreateCode: readFileSync('build/rental_state_hook.wasm').toString('hex').toUpperCase(),
            HookOn: HOOK_ON,
            HookApiVersion: 0,
            Flags: SetHookFlags.hsfOverride + SetHookFlags.hsfNSDelete,
          },
        };
        break;
      case SetHookType.UPDATE:
        hook_basic = {
          Hook: {
            ...hook_basic.Hook,
            HookNamespace: input.hookNamespace,
            ...(input.grants && { HookGrants: input.grants }),
          },
        };
        break;
      case SetHookType.RESET:
        hook_basic = {
          Hook: {
            ...hook_basic.Hook,
            HookNamespace: input.hookNamespace,
            Flags: SetHookFlags.hsfNSDelete,
          },
        };
        break;
      case SetHookType.DELETE:
        hook_basic = {
          Hook: {
            ...hook_basic.Hook,
            CreateCode: '',
            Flags: SetHookFlags.hsfOverride,
          },
        };
    }

    return {
      ...tx_basic,
      Hooks: [hook_basic],
    };
  }
}
