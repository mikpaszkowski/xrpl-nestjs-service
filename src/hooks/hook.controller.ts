import { Body, Controller, Delete, Get, Param, Post, Put, UnprocessableEntityException } from '@nestjs/common';
import { HookService } from './hook.service';
import { HookInputDTO, HookInstallOutputDTO } from './dto/hook-input.dto';
import { IAccountHookOutputDto } from './dto/hook-output.dto';
import { isValidAddress } from '@transia/xrpl';
import { XrplService } from '../xrpl/client/client.service';
import { mapXRPLBaseResponseToDto } from '../common/api.utils';

@Controller('hook')
export class HookController {
  constructor(private readonly service: HookService, private readonly xrpl: XrplService) {}

  @Post()
  async deployHook(@Body() inputDTO: HookInputDTO): Promise<HookInstallOutputDTO> {
    const result: any = await this.service.install(inputDTO);
    return mapXRPLBaseResponseToDto(result);
  }

  @Delete()
  async deleteHook(@Body() inputDTO: HookInputDTO): Promise<HookInstallOutputDTO> {
    const result: any = await this.service.remove(inputDTO);
    return mapXRPLBaseResponseToDto(result);
  }

  @Put('/reset')
  async resetHook(@Body() inputDTO: HookInputDTO) {
    const result: any = await this.service.resetHook(inputDTO);
    return mapXRPLBaseResponseToDto(result);
  }

  @Get(':address')
  async accountHooks(@Param('address') address: string): Promise<IAccountHookOutputDto[]> {
    if (!isValidAddress(address)) {
      throw new UnprocessableEntityException('Account address is invalid');
    }
    return this.service.getAccountHooksStates(address);
  }
}
