import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { SetHook, SetHookFlags, SubmitResponse } from '@transia/xrpl';
import { readFileSync } from 'fs';
import { createHash, randomBytes } from 'node:crypto';
import { HookInstallInputDTO, HookRemoveInputDTO, HookResetInputDTO } from './dto/hook-install.dto';
import * as process from 'process';
import { Hook } from '@transia/xrpl/dist/npm/models/common';

const HOOK_ON_URI_CREATE_BUY_ONLY = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE7FFFFFDFFFFF';

@Injectable()
export class HookService {
  constructor(private readonly xrpl: XrplService) {}

  async install(input: HookInstallInputDTO): Promise<SubmitResponse> {
    const response = await this.xrpl.getAccountBasicInfo(input.accountNumber);

    const ns = await this.getHookNamespace(input.accountNumber);

    // Hash the random bytes using SHA256
    const randomBytesForNS = randomBytes(32);
    const HOOK_NS = createHash('sha256').update(randomBytesForNS).digest('hex').toUpperCase();
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
            HookNamespace: ns || HOOK_NS,
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

  async remove(input: HookRemoveInputDTO) {
    console.log(input);
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

  async getAccountHooks(account: string) {
    return await this.xrpl.getAccountHooks(account);
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
  async getHookNamespace(accountNumber: string): Promise<string | undefined> {
    let ns;
    try {
      const accountHooks = await this.xrpl.getAccountHooks(accountNumber);
      ns = accountHooks.result.node['Hooks'].map((entry: Hook) => entry.Hook.HookNamespace)[0];
    } catch (err) {
      console.log(err);
    }
    return ns;
  }
}
