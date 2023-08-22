import { Module } from '@nestjs/common';
import { HookController } from './hook.controller';
import { HookService } from './hook.service';
import { XrplService } from '../xrpl/client/client.service';
import { HookTransactionFactory } from './hook.factory';

@Module({
  controllers: [HookController],
  providers: [HookService, XrplService, HookTransactionFactory],
})
export class HookModule {}
