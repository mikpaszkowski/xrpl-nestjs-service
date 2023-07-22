import { Body, Controller, Delete, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { RentalService } from './rental.service';
import { OfferType } from './retnals.constants';
import { AcceptRentalOffer, CancelRentalOfferDTO, URITokenInputDTO } from './dto/rental.dto';
import { XRPLBaseResponse } from '../uriToken/dto/uri-token-output.dto';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly service: RentalService) {}

  @Post('offers')
  async createLendOffer(@Query('type') type: OfferType, @Body() input: URITokenInputDTO): Promise<XRPLBaseResponse> {
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

  @Delete('offers/:index')
  async cancelOffer(@Param('index') index: string, @Body() input: CancelRentalOfferDTO): Promise<XRPLBaseResponse> {
    try {
      const response = await this.service.cancelRentalOffer(index, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not cancel the sell offer: ${index}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post('start-offers/:index/accept')
  async acceptRentalOffer(@Param('index') index: string, @Body() input: AcceptRentalOffer): Promise<XRPLBaseResponse> {
    try {
      const response = await this.service.acceptRentalOffer(index, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not accept the rental offer of the URIToken: ${index}.`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post('return-offer/:index/accept')
  async acceptReturnRentalOffer(
    @Param('index') index: string,
    @Body() input: AcceptRentalOffer
  ): Promise<XRPLBaseResponse> {
    try {
      const response = await this.service.acceptReturnOffer(index, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not accept the return rental offer of the URIToken: ${index}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }
}
