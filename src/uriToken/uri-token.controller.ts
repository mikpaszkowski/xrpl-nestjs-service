import { Body, Controller, Delete, HttpException, HttpStatus, Post } from '@nestjs/common';
import { UriTokenService } from './uri-token.service';
import { CancelRentalOfferDTO, URITokenInputDTO } from './dto/uri-token-input.dto';
import { URITokenOutputDto } from './dto/uri-token-output.dto';

@Controller('uri-token')
export class UriTokenController {
  constructor(private readonly service: UriTokenService) {}

  @Post()
  async lend(@Body() input: URITokenInputDTO): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.lendURIToken(input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not lend the URIToken: ${input.uri} to account: ${input.destinationAccount}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Delete()
  async cancelOffer(@Body() input: CancelRentalOfferDTO): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.cancelRentalOffer(input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not cancel the sell offer of URIToken: ${input.uri}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post()
  async finish(@Body() input: URITokenInputDTO): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.finishRental(input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not finish the rental of URIToken: ${input.uri}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }
}
