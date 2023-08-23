import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { URITokenService } from './uri-token-service.service';
import { MintURITokenInputDTO } from './dto/uri-token-input.dto';
import { URITokenOutputDTO, XRPLBaseResponseDTO } from './dto/uri-token-output.dto';
import { Account } from '../account/interfaces/account.interface';

@Controller('uri-tokens')
export class UriTokenController {
  constructor(private readonly service: URITokenService) {}

  @Post()
  async mintURIToken(@Body() input: MintURITokenInputDTO): Promise<XRPLBaseResponseDTO> {
    const result: any = await this.service.mintURIToken(input);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }

  @Get(':address')
  async getURITokens(@Param('address') address: string): Promise<URITokenOutputDTO[]> {
    const response = await this.service.getAccountTokens(address);
    return response;
  }

  @Delete(':index')
  async removeURIToken(@Param('index') index: string, @Body() account: Account): Promise<XRPLBaseResponseDTO> {
    const result: any = await this.service.removeURIToken(account, index);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }
}
