import { Body, Controller, Delete, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { AcceptRentalOffer, CancelRentalOfferDTO, URITokenInputDTO } from '../uriToken/dto/uri-token-input.dto';
import { URITokenOutputDto } from '../uriToken/dto/uri-token-output.dto';
import { RentalService } from './rental.service';
import { OfferType } from './retnals.constants';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly service: RentalService) {}

  @Post('offers')
  async createLendOffer(@Query('type') type: OfferType, @Body() input: URITokenInputDTO): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.createOffer(type, input);
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

  @Delete('offers/:id')
  async cancelOffer(@Param('id') id: string, @Body() input: CancelRentalOfferDTO): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.cancelRentalOffer(id, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not cancel the sell offer: ${id}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post('start-offers/:uri/accept')
  async acceptRentalOffer(@Param('uri') uri: string, @Body() input: AcceptRentalOffer): Promise<URITokenOutputDto> {
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
          error: `Could not accept the rental offer of the URIToken: ${uri}.`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post('return-offer/:uri/accept')
  async acceptReturnRentalOffer(
    @Param('uri') uri: string,
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
}
