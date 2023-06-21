import { Module } from '@nestjs/common';
import { HookController } from './hook.controller';
import { HookService } from './hook.service';
import { XrplService } from '../xrpl/client/client.service';

@Module({
  controllers: [HookController],
  providers: [HookService, XrplService],
})
export class HookModule {}
