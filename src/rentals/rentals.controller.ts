import { Body, Controller, Delete, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { URITokenOutputDto } from '../uriToken/dto/uri-token-output.dto';
import { RentalService } from './rental.service';
import { OfferType } from './retnals.constants';
import { AcceptRentalOffer, CancelRentalOfferDTO, FindIndexOneParam, URITokenInputDTO } from './dto/rental.dto';

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

  @Delete('offers/:index')
  async cancelOffer(
    @Param('index') params: FindIndexOneParam,
    @Body() input: CancelRentalOfferDTO
  ): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.cancelRentalOffer(params.index, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not cancel the sell offer: ${params.index}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }

  @Post('start-offers/:index/accept')
  async acceptRentalOffer(
    @Param('index') params: FindIndexOneParam,
    @Body() input: AcceptRentalOffer
  ): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.acceptRentalOffer(params.index, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not accept the rental offer of the URIToken: ${params.index}.`,
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
    @Param('index') params: FindIndexOneParam,
    @Body() input: AcceptRentalOffer
  ): Promise<URITokenOutputDto> {
    try {
      const response = await this.service.acceptReturnOffer(params.index, input);
      return {
        tx_hash: response.result.tx_json.hash,
        result: response.result.engine_result,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `Could not accept the return rental offer of the URIToken: ${params.index}`,
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: err,
        }
      );
    }
  }
}
