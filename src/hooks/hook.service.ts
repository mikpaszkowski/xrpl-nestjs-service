import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { SetHook, SubmitResponse } from '@transia/xrpl';
import { readFileSync } from 'fs';
import { createHash, randomBytes } from 'node:crypto';
import { HookInstallInputDTO, HookRemoveInputDTO, HookResetInputDTO } from './dto/hook-install.dto';
import * as process from 'process';

const HOOK_ON_URI_CREATE_BUY_ONLY = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE7FFFFFDFFFFF';

@Injectable()
export class HookService {
  constructor(private readonly xrpl: XrplService) {}

  async install(input: HookInstallInputDTO): Promise<SubmitResponse> {
    const response = await this.xrpl.getAccountBasicInfo(input.accountNumber);

    const randomBytesForNS = randomBytes(32);

    // Hash the random bytes using SHA256
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
            CreateCode: readFileSync('src/hooks/resources/rental_state_hook.wasm').toString('hex').toUpperCase(),
            HookOn: HOOK_ON_URI_CREATE_BUY_ONLY,
            HookNamespace: HOOK_NS,
            ...(input.grants && { HookGrants: input.grants }),
            HookApiVersion: 0,
            Flags: 1,
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
            CreateCode: '',
            Flags: 1,
          },
        },
      ],
      Flags: {
        hsfOverride: true,
        hsfNSDelete: true,
      },
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
          },
        },
      ],
      Flags: {
        hsfNSDelete: true,
      },
    };
    return await this.xrpl.submitTransaction(tx, {
      address: input.accountNumber,
      secret: input.seed,
    });
  }
  async getHookNamespace() {} // HOWWWW ???????
}
