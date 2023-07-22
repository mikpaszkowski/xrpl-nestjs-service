import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { LedgerEntryRequest, LedgerEntryResponse, SetHook, SetHookFlags, SubmitResponse } from '@transia/xrpl';
import { readFileSync } from 'fs';
import { createHash, randomBytes } from 'node:crypto';
import { HookInputDTO } from './dto/hook-input.dto';
import * as process from 'process';
import { Hook, HookGrant } from '@transia/xrpl/dist/npm/models/common';
import { StateUtility } from '@transia/hooks-toolkit';
import HookDefintion from '@transia/xrpl/dist/npm/models/ledger/HookDefinition';
import { HOOK_ON, SetHookType } from './hook.constants';

interface ISetHookPrepareInput {
  type: SetHookType;
  account: string;
  hookNamespace?: string;
  grants?: HookGrant[];
}

@Injectable()
export class HookService {
  constructor(private readonly xrpl: XrplService) {}

  async install(input: HookInputDTO): Promise<SubmitResponse> {
    const hookNamespace = await this.getNamespaceIfExistsOrDefault(input.accountNumber);
    const installHook_tx: SetHook = await this.prepareSetHookTx({
      type: SetHookType.INSTALL,
      account: input.accountNumber,
      hookNamespace,
    });
    return await this.xrpl.submitTransaction(installHook_tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }

  async getNamespaceIfExistsOrDefault(address: string): Promise<string> {
    let hookDefinition;
    let hook;
    try {
      hook = await this.getAccountHook(address);
      hookDefinition = await StateUtility.getHookDefinition(this.xrpl.getClient(), hook.Hook.HookHash);
    } catch (err) {
      console.log(err);
    }

    const randomBytesForNS = randomBytes(32);
    const HOOK_NS = createHash('sha256').update(randomBytesForNS).digest('hex').toUpperCase();
    if (hook === undefined) {
      return HOOK_NS;
    }
    if (this.doesAccountHaveExistingHookWithEmptyNS(hook, hookDefinition) && hookDefinition) {
      return hookDefinition.HookNamespace;
    }
    return hook.Hook.HookNamespace;
  }

  doesAccountHaveExistingHookWithEmptyNS(accountHook: Hook | undefined, hookDef: HookDefintion): boolean {
    return (
      accountHook && accountHook.Hook.HookNamespace === undefined && accountHook.Hook.HookHash === hookDef.HookHash
    );
  }

  async remove(input: HookInputDTO) {
    const removeHook_tx: SetHook = await this.prepareSetHookTx({
      type: SetHookType.DELETE,
      account: input.accountNumber,
    });
    return await this.xrpl.submitTransaction(removeHook_tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }

  async resetHook(input: HookInputDTO) {
    const resetHook_tx: SetHook = await this.prepareSetHookTx({
      type: SetHookType.RESET,
      account: input.accountNumber,
      hookNamespace: input.namespace,
    });
    return await this.xrpl.submitTransaction(resetHook_tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }

  //TODO fix it, account can have many hooks so we need to filter array of hooks with KNOWN HookHash of a rental hook
  async getAccountHook(accountNumber: string): Promise<Hook> {
    try {
      const hooks = await this.getListOfHooks(accountNumber);
      return hooks[0];
    } catch (err) {
      console.log(err);
    }
  }

  async updateHook(input: HookInputDTO) {
    const hookNamespace = await this.getNamespaceIfExistsOrDefault(input.accountNumber);
    const updateHook_tx: SetHook = await this.prepareSetHookTx({
      type: SetHookType.UPDATE,
      account: input.accountNumber,
      hookNamespace,
      grants: input.grants,
    });
    return await this.xrpl.submitTransaction(updateHook_tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }

  async getListOfHooks(account: string): Promise<Hook[]> {
    try {
      const hookReq: LedgerEntryRequest = {
        command: 'ledger_entry',
        hook: {
          account: account,
        },
      };
      const response = await this.xrpl.submitRequest<LedgerEntryRequest, LedgerEntryResponse>(hookReq);
      return response.result.node['Hooks'];
    } catch (err) {
      return [];
    }
  }

  async prepareSetHookTx(input: ISetHookPrepareInput): Promise<SetHook> {
    const response = await this.xrpl.getAccountBasicInfo(input.account);
    const tx_basic: SetHook = {
      Account: input.account,
      TransactionType: 'SetHook',
      Fee: '200000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
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
