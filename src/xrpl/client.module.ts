import { Module } from '@nestjs/common';
import { XrplService } from './client/client.service';

@Module({
  providers: [XrplService],
  exports: [XrplService],
})
export class ClientModule {}
