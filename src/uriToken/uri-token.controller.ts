import { Body, Controller, Delete, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { UriTokenService } from './uri-token.service';
import {
  AcceptRentalOffer,
  CancelRentalOfferDTO,
  MintURITokenInputDTO,
  URITokenInputDTO,
} from './dto/uri-token-input.dto';
import { URITokenOutputDto } from './dto/uri-token-output.dto';

@Controller('uri-token')
export class UriTokenController {
  constructor(private readonly service: UriTokenService) {}

  @Post()
  async createLendOffer(@Body() input: URITokenInputDTO): Promise<URITokenOutputDto> {
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
          error: `Could not create offer to lend the URIToken: ${input.uri} for account: ${input.destinationAccount}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post(':uri')
  async createReturnOffer(@Param(':uri') uri: string, @Body() input: URITokenInputDTO): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.finishRental(uri, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not create a return offer of the URIToken: ${input.uri} to account: ${input.destinationAccount}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Delete(':uri')
  async cancelOffer(@Param('uri') uri: string, @Body() input: CancelRentalOfferDTO): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.cancelRentalOffer(uri, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not cancel the sell offer of URIToken: ${uri}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post('uri')
  async acceptRentalOffer(@Param('uri') uri: string, @Body() input: URITokenInputDTO): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.acceptRentalOffer(uri, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not accept the rental offer of the URIToken: ${input.uri} to account: ${input.destinationAccount}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post(':uri')
  async acceptReturnRentalOffer(
    @Param(':uri') uri: string,
    @Body() input: AcceptRentalOffer
  ): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.acceptReturnOffer(uri, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not accept the return rental offer of the URIToken: ${uri}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post()
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
}
