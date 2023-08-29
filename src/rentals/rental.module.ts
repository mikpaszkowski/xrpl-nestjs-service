import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalService } from './rental.service';
import { HookService } from '../hooks/hook.service';
import { RentalsTransactionFactory } from './rentals.transactionFactory';
import { HookTransactionFactory } from '../hooks/hook.factory';
import { XrplService } from '../xrpl/client/client.service';
import { URITokenService } from '../uriToken/uri-token.service';

@Module({
  controllers: [RentalsController],
  providers: [
    XrplService,
    RentalService,
    HookService,
    RentalsTransactionFactory,
    HookTransactionFactory,
    URITokenService,
  ],
})
export class RentalModule {}
