import { Body, Controller, Delete, Get, Param, Post, Put, UnprocessableEntityException } from '@nestjs/common';
import { HookService } from './hook.service';
import { HookInputDTO, HookInstallOutputDTO } from './dto/hook-input.dto';
import { Hook } from '@transia/xrpl/dist/npm/models/common';
import { HookState, IAccountHookOutputDto } from './dto/hook-output.dto';
import { isValidAddress } from '@transia/xrpl';
import { XrplService } from '../xrpl/client/client.service';

@Controller('hook')
export class HookController {
  constructor(private readonly service: HookService, private readonly xrpl: XrplService) {}

  @Post()
  async deployHook(@Body() inputDTO: HookInputDTO): Promise<HookInstallOutputDTO> {
    const result: any = await this.service.install(inputDTO);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }

  @Delete()
  async deleteHook(@Body() inputDTO: HookInputDTO) {
    const result: any = await this.service.remove(inputDTO);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }

  @Put('/reset')
  async resetHook(@Body() input: HookInputDTO) {
    const result: any = await this.service.resetHook(input);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }

  @Get(':address')
  async accountHooks(@Param('address') address: string): Promise<IAccountHookOutputDto[]> {
    if (!isValidAddress(address)) {
      throw new UnprocessableEntityException('Account address is invalid');
    }
    const namespace = await this.service.getNamespaceIfExistsOrDefault(address);
    const response = await this.service.getListOfHooks(address);
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
}
