import { Module } from '@nestjs/common';
import { HookController } from './hook.controller';
import { HookService } from './service';
import { XrplService } from '../xrpl/client.service';

@Module({
  controllers: [HookController],
  providers: [HookService, XrplService],
})
export class HookModule {}
