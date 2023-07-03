import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { HookService } from './hook.service';
import { HookInstallInputDTO, HookInstallOutputDTO, HookRemoveInputDTO } from './dto/hook-install.dto';

@Controller('hook')
export class HookController {
  constructor(private readonly service: HookService) {}

  @Post()
  async installHook(@Body() inputDTO: HookInstallInputDTO): Promise<HookInstallOutputDTO> {
    try {
      const response = await this.service.install(inputDTO);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Hook installation on account: ${inputDTO.accountNumber} has failed`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Delete()
  async deleteHook(@Body() inputDTO: HookRemoveInputDTO) {
    try {
      const response = await this.service.remove(inputDTO);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Hook removal on account: ${inputDTO.accountNumber} has failed`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Get(':account')
  async accountHooks(@Param('account') account: string) {
    return this.service.getAccountHooks(account);
  }
}
