import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { XrplService } from '../xrpl/client/client.service';

@Module({
  controllers: [AccountController],
  providers: [XrplService],
})
export class AccountModule {}
