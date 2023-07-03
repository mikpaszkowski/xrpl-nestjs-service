import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalService } from './rental.service';
import { XrplService } from '../xrpl/client/client.service';

@Module({
  controllers: [RentalsController],
  providers: [RentalService, XrplService],
})
export class RentalModule {}
