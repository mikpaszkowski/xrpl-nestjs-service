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
    const result: any = await this.service.createOffer(type, input);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }

  @Delete('offers/:index')
  async cancelOffer(@Param('index') index: string, @Body() input: CancelRentalOfferDTO): Promise<XRPLBaseResponse> {
    const result: any = await this.service.cancelRentalOffer(index, input);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }

  @Post('start-offers/:index/accept')
  async acceptRentalOffer(@Param('index') index: string, @Body() input: AcceptRentalOffer): Promise<XRPLBaseResponse> {
    const result: any = await this.service.acceptRentalOffer(index, input);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }

  @Post('return-offer/:index/accept')
  async acceptReturnRentalOffer(
    @Param('index') index: string,
    @Body() input: AcceptRentalOffer
  ): Promise<XRPLBaseResponse> {
    const result: any = await this.service.acceptReturnOffer(index, input);
    return {
      tx_hash: result.response.tx_json.hash,
      result: result.response.engine_result,
    };
  }
}
