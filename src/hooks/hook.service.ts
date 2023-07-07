import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { LedgerEntryRequest, LedgerEntryResponse, SetHook, SetHookFlags, SubmitResponse } from '@transia/xrpl';
import { readFileSync } from 'fs';
import { createHash, randomBytes } from 'node:crypto';
import { HookDeployInputDTO, HookRemoveInputDTO, HookResetInputDTO } from './dto/hook-install.dto';
import * as process from 'process';
import { Hook } from '@transia/xrpl/dist/npm/models/common';
import { StateUtility } from '@transia/hooks-toolkit';
import HookDefintion from '@transia/xrpl/dist/npm/models/ledger/HookDefinition';

const HOOK_ON_URI_CREATE_BUY_ONLY = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE7FFFFFDFFFFF';

@Injectable()
export class HookService {
  constructor(private readonly xrpl: XrplService) {}

  async install(input: HookDeployInputDTO): Promise<SubmitResponse> {
    const response = await this.xrpl.getAccountBasicInfo(input.accountNumber);
    const hookNamespace = await this.getNamespaceIfExistsOrDefault(input);
    console.log(hookNamespace);
    const tx: SetHook = {
      Account: input.accountNumber,
      TransactionType: 'SetHook',
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      Hooks: [
        {
          Hook: {
            CreateCode: readFileSync('build/rental_state_hook.wasm').toString('hex').toUpperCase(),
            HookOn: HOOK_ON_URI_CREATE_BUY_ONLY,
            HookNamespace: hookNamespace,
            ...(input.grants && { HookGrants: input.grants }),
            HookApiVersion: 0,
            Flags: SetHookFlags.hsfOverride + SetHookFlags.hsfNSDelete,
          },
        },
      ],
    };

    return await this.xrpl.submitTransaction(tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }

  async getNamespaceIfExistsOrDefault(input: HookDeployInputDTO): Promise<string> {
    let hookDefinition;
    let hook;
    try {
      hook = await this.getAccountHook(input.accountNumber);
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

  async remove(input: HookRemoveInputDTO) {
    const response = await this.xrpl.getAccountBasicInfo(input.accountNumber);
    const tx: SetHook = {
      Account: input.accountNumber,
      TransactionType: 'SetHook',
      Fee: '200000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      Hooks: [
        {
          Hook: {
            CreateCode: '',
            Flags: SetHookFlags.hsfOverride,
          },
        },
      ],
    };
    return await this.xrpl.submitTransaction(tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }

  async resetHook(input: HookResetInputDTO) {
    const response = await this.xrpl.getAccountBasicInfo(input.accountNumber);
    const tx: SetHook = {
      Account: input.accountNumber,
      TransactionType: 'SetHook',
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      Hooks: [
        {
          Hook: {
            HookNamespace: input.namespace,
            Flags: SetHookFlags.hsfNSDelete,
          },
        },
      ],
    };
    return await this.xrpl.submitTransaction(tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }

  //TODO fix it, account can have many hooks so we need to filter array of hooks with KNOWN HookHash of a rental hook
  async getAccountHook(accountNumber: string): Promise<Hook> {
    try {
      const accountHooks = await this.getListOfHooks(accountNumber);
      return accountHooks.result.node['Hooks'][0];
    } catch (err) {
      console.log(err);
    }
  }

  async updateHook(input: HookDeployInputDTO) {
    const response = await this.xrpl.getAccountBasicInfo(input.accountNumber);
    const hook = await this.getAccountHook(input.accountNumber);
    const hookDefinition = await StateUtility.getHookDefinition(this.xrpl.getClient(), hook.Hook.HookHash);

    const tx: SetHook = {
      Account: input.accountNumber,
      TransactionType: 'SetHook',
      Fee: '1000',
      Sequence: response.Sequence,
      NetworkID: parseInt(process.env.NETWORK_ID),
      Hooks: [
        {
          Hook: {
            HookNamespace: hookDefinition.HookNamespace,
            ...(input.grants && { HookGrants: input.grants }),
          },
        },
      ],
    };

    return await this.xrpl.submitTransaction(tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }

  async getListOfHooks(account: string) {
    const hookReq: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook: {
        account: account,
      },
    };
    return await this.xrpl.submitRequest<LedgerEntryRequest, LedgerEntryResponse>(hookReq);
  }
}
