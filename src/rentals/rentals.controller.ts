import { Body, Controller, Delete, Param, Post, Query } from '@nestjs/common';
import { RentalService } from './rental.service';
import { OfferType } from './retnals.constants';
import { AcceptRentalOffer, CancelRentalOfferDTO, URITokenInputDTO } from './dto/rental.dto';
import { XRPLBaseResponseDTO } from '../uriToken/dto/uri-token-output.dto';
import { mapXRPLBaseResponseToDto } from '../common/api.utils';

@Controller('offers')
export class RentalsController {
  constructor(private readonly service: RentalService) {}

  @Post()
  async createLendOffer(@Query('type') type: OfferType, @Body() input: URITokenInputDTO): Promise<XRPLBaseResponseDTO> {
    const result: any = await this.service.createOffer(type, input);
    return mapXRPLBaseResponseToDto(result);
  }

  @Delete(':index')
  async cancelOffer(@Param('index') index: string, @Body() input: CancelRentalOfferDTO): Promise<XRPLBaseResponseDTO> {
    const result: any = await this.service.cancelRentalOffer(index, input);
    return mapXRPLBaseResponseToDto(result);
  }

  @Post(':index/accept-start')
  async acceptRentalOffer(
    @Param('index') index: string,
    @Body() input: AcceptRentalOffer
  ): Promise<XRPLBaseResponseDTO> {
    const result: any = await this.service.acceptRentalOffer(index, input);
    return mapXRPLBaseResponseToDto(result);
  }

  @Post(':index/accept-return')
  async acceptReturnRentalOffer(
    @Param('index') index: string,
    @Body() input: AcceptRentalOffer
  ): Promise<XRPLBaseResponseDTO> {
    const result: any = await this.service.acceptReturnOffer(index, input);
    return mapXRPLBaseResponseToDto(result);
  }
}
