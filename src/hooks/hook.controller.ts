import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { HookService } from './service';
import { HookInstallInputDTO, HookInstallOutputDTO } from './dto/hook-install.dto';

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
}
