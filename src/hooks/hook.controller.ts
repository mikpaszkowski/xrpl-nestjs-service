import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HookService } from './hook.service';
import { HookInputDTO, HookInstallOutputDTO } from './dto/hook-input.dto';
import { Hook } from '@transia/xrpl/dist/npm/models/common';
import { IAccountHookOutputDto } from './dto/hook-output.dto';
import { isValidAddress } from '@transia/xrpl';

@Controller('hook')
export class HookController {
  constructor(private readonly service: HookService) {}

  @Post()
  async deployHook(@Body() inputDTO: HookInputDTO): Promise<HookInstallOutputDTO> {
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

  @Post('/grant')
  async grantAccess(@Body() inputDTO: HookInputDTO): Promise<HookInstallOutputDTO> {
    try {
      const response = await this.service.updateHook(inputDTO);
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
  async deleteHook(@Body() inputDTO: HookInputDTO) {
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

  @Put('/reset')
  async resetHook(@Body() input: HookInputDTO) {
    try {
      const response = await this.service.resetHook(input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Hook reset on account: ${input.accountNumber} has failed`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Get(':address')
  async accountHooks(@Param('address') address: string): Promise<IAccountHookOutputDto[]> {
    if (!isValidAddress(address)) {
      throw new UnprocessableEntityException('Account address is invalid');
    }
    Logger.log(address);
    const response = await this.service.getListOfHooks(address);
    Logger.log(response);
    return response
      ?.map((hookObj: Hook) => hookObj.Hook)
      ?.map((hook) => {
        return {
          flags: hook.Flags,
          hookHash: hook.HookHash,
          hookNamespace: hook.HookNamespace,
          hookGrants: hook.HookGrants?.map(({ HookGrant }) => {
            return {
              hookHash: HookGrant.HookHash,
              authorize: HookGrant.Authorize,
            };
          }),
        };
      });
  }
}
