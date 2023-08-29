import { Injectable, Logger } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { LedgerEntryRequest, LedgerEntryResponse, SetHook, SubmitResponse } from '@transia/xrpl';
import { createHash, randomBytes } from 'node:crypto';
import { HookInputDTO } from './dto/hook-input.dto';
import { Hook } from '@transia/xrpl/dist/npm/models/common';
import { StateUtility } from '@transia/hooks-toolkit';
import HookDefintion from '@transia/xrpl/dist/npm/models/ledger/HookDefinition';
import { SetHookType } from './hook.constants';
import { HookTransactionFactory } from './hook.factory';
import { HookState, IAccountHookOutputDto } from './dto/hook-output.dto';
import { BaseResponse } from '@transia/xrpl/dist/npm/models/methods/baseMethod';
import { URITokenInputDTO } from '../rentals/dto/rental.dto';

@Injectable()
export class HookService {
  constructor(private readonly xrpl: XrplService) {}

  async install(input: HookInputDTO): Promise<SubmitResponse> {
    const hookNamespace = await this.getNamespaceIfExistsOrDefault(input.address);
    const installHook_tx: SetHook = await HookTransactionFactory.prepareSetHookTx({
      type: SetHookType.INSTALL,
      account: input.address,
      hookNamespace,
    });
    return await this.xrpl.submitTransaction(installHook_tx, {
      address: input.address,
      secret: input.secret,
    });
  }

  async getNamespaceIfExistsOrDefault(address: string): Promise<string> {
    let hookDefinition;
    const hook = await this.getAccountRentalHook(address);
    try {
      const client = await this.xrpl.getClient();
      hookDefinition = await StateUtility.getHookDefinition(client, hook?.Hook?.HookHash);
    } catch (err) {
      Logger.warn(err?.message);
    }

    if (hook === undefined) {
      return this.generateRandomNamespace();
    }
    if (this.doesAccountHaveExistingHookWithEmptyNS(hook, hookDefinition) && hookDefinition) {
      return hookDefinition.HookNamespace;
    }
    return hook.Hook.HookNamespace;
  }

  async remove(input: HookInputDTO): Promise<BaseResponse> {
    const removeHook_tx: SetHook = await HookTransactionFactory.prepareSetHookTx({
      type: SetHookType.DELETE,
      account: input.address,
    });
    return await this.xrpl.submitTransaction(removeHook_tx, {
      address: input.address,
      secret: input.secret,
    });
  }

  async resetHook(input: HookInputDTO) {
    const resetHook_tx: SetHook = await HookTransactionFactory.prepareSetHookTx({
      type: SetHookType.RESET,
      account: input.address,
      hookNamespace: input.namespace,
    });
    return await this.xrpl.submitTransaction(resetHook_tx, {
      address: input.address,
      secret: input.secret,
    });
  }

  async getAccountHooksStates(address: string): Promise<IAccountHookOutputDto[]> {
    const namespace = await this.getNamespaceIfExistsOrDefault(address);
    const response = await this.getListOfHooks(address);
    return Promise.all(
      response
        ?.map((hookObj: Hook) => hookObj.Hook)
        ?.map(async (hook) => {
          return {
            flags: hook.Flags,
            hookHash: hook.HookHash,
            hookNamespace: hook.HookNamespace || namespace,
            hookGrants: hook.HookGrants?.map(({ HookGrant }) => {
              return {
                hookHash: HookGrant.HookHash,
                authorize: HookGrant.Authorize,
              };
            }),
            hookState: await this.getHookNSInternalState(address, hook.HookNamespace || namespace),
          };
        })
    );
  }

  async getHookNSInternalState(address: string, namespace: string): Promise<HookState[]> {
    try {
      return (await this.xrpl.getAccountNamespace(address, namespace)).result.namespace_entries.map((entry) => {
        return {
          index: entry['index'],
          key: entry['HookStateKey'],
          data: entry['HookStateData'],
        } as HookState;
      });
    } catch (err) {
      return [];
    }
  }

  async getAccountRentalHook(accountNumber: string): Promise<Hook | undefined> {
    try {
      const hooks = await this.getListOfHooks(accountNumber);
      return hooks[0];
    } catch (err) {
      Logger.error(err);
    }
  }

  async updateHook(input: HookInputDTO): Promise<BaseResponse> {
    const hookNamespace = await this.getNamespaceIfExistsOrDefault(input.address);
    const updateHook_tx: SetHook = await HookTransactionFactory.prepareSetHookTx({
      type: SetHookType.UPDATE,
      account: input.address,
      hookNamespace,
      grants: input.grants,
    });
    console.log(updateHook_tx);
    return await this.xrpl.submitTransaction(updateHook_tx, {
      address: input.address,
      secret: input.secret,
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

  async grantAccessToHook(input: URITokenInputDTO): Promise<BaseResponse> {
    const hook = await this.getAccountRentalHook(input.account.address);
    const hookNamespace = await this.getNamespaceIfExistsOrDefault(input.account.address);
    const grantHookAccessInput: HookInputDTO = {
      address: input.account.address,
      secret: input.account.secret,
      grants: [
        {
          HookGrant: {
            HookHash: hook.Hook.HookHash,
            Authorize: input.destinationAccount,
          },
        },
      ],
    };
    Logger.log(
      `HookGrant sent by: ${input.account.address} for account: ${input.destinationAccount} to access namespace: ${hookNamespace}`
    );
    return await this.updateHook(grantHookAccessInput);
  }

  private generateRandomNamespace() {
    const randomBytesForNS = randomBytes(32);
    const hash = createHash('sha256');
    hash.update(randomBytesForNS);
    return hash.digest('hex').toUpperCase();
  }

  doesAccountHaveExistingHookWithEmptyNS(accountHook: Hook | undefined, hookDef: HookDefintion): boolean {
    return (
      !!accountHook && accountHook.Hook.HookNamespace === undefined && accountHook.Hook.HookHash === hookDef.HookHash
    );
  }
}
