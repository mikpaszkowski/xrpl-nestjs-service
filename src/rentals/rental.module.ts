import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalService } from './rental.service';
import { XrplService } from '../xrpl/client/client.service';
import { HookService } from '../hooks/hook.service';

@Module({
  controllers: [RentalsController],
  providers: [RentalService, XrplService, HookService],
})
export class RentalModule {}
