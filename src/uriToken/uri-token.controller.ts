import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UriTokenService } from './uri-token.service';
import { MintURITokenInputDTO } from './dto/uri-token-input.dto';
import { URITokenOutputDTO, XRPLBaseResponse } from './dto/uri-token-output.dto';
import { XrplService } from '../xrpl/client/client.service';
import HookState from '@transia/xrpl/dist/npm/models/ledger/URIToken';
import { UriTokenMapper } from './mapper/uri-token.mapper';
import { isValidAddress } from '@transia/xrpl';

@Controller('uri-tokens')
export class UriTokenController {
  constructor(private readonly service: UriTokenService, private readonly xrpl: XrplService) {}

  @Post('mint')
  async mintURIToken(@Body() input: MintURITokenInputDTO): Promise<XRPLBaseResponse> {
    try {
      const response = await this.service.mintURIToken(input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not mint the URIToken: ${input.uri}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Get(':address')
  async getURITokens(@Param('address') address: string): Promise<URITokenOutputDTO[]> {
    if (!isValidAddress(address)) {
      throw new UnprocessableEntityException('Account address is invalid');
    }
    const uriTokenLedgerObjects = await this.service.getAccountTokens(address);
    return uriTokenLedgerObjects.result.account_objects.map((ledgerObj: HookState) =>
      UriTokenMapper.mapUriTokenToDto(ledgerObj)
    );
  }
}
