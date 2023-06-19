import { Injectable } from '@nestjs/common';
import { XrplService } from '../xrpl/client.service';
import { SetHook, SubmitResponse } from '@transia/xrpl';
import { readFileSync } from 'fs';
import { createHash, randomBytes } from 'node:crypto';
import { HookInstallInputDTO } from './dto/hook-install.dto';

const HOOK_ON_URI_CREATE_BUY_ONLY = 'fffffffffffffffffffffffffffffffffffffffffffffffffffe7fffffdfffff'.toUpperCase();

@Injectable()
export class HookService {
  constructor(private readonly xrpl: XrplService) {}

  async install(input: HookInstallInputDTO): Promise<SubmitResponse> {
    const response = await this.xrpl.client.request({
      command: 'account_info',
      account: input.accountNumber,
      ledger_index: 'validated',
    });

    const randomBytesForNS = randomBytes(32);

    // Hash the random bytes using SHA256
    const HOOK_NS = createHash('sha256').update(randomBytesForNS).digest('hex').toUpperCase();

    const tx: SetHook = {
      Account: input.accountNumber,
      TransactionType: 'SetHook',
      Fee: '1000',
      Sequence: response.result.account_data.Sequence,
      NetworkID: 21338,
      Hooks: [
        {
          Hook: {
            CreateCode: readFileSync('src/hooks/resources/rental_state_hook.wasm').toString('hex').toUpperCase(),
            HookOn: HOOK_ON_URI_CREATE_BUY_ONLY,
            HookNamespace: HOOK_NS,
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
}
