import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { UriTokenService } from './uri-token.service';
import { MintURITokenInputDTO } from './dto/uri-token-input.dto';
import { URITokenOutputDto } from './dto/uri-token-output.dto';
import { XrplService } from '../xrpl/client/client.service';

@Controller('uri-tokens')
export class UriTokenController {
  constructor(private readonly service: UriTokenService, private readonly xrpl: XrplService) {}

  @Post('mint')
  async mintURIToken(@Body() input: MintURITokenInputDTO): Promise<URITokenOutputDto> {
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
  async getURITokens(@Param('address') address: string) {
    return await this.xrpl.getAccountTokens(address);
  }
}
