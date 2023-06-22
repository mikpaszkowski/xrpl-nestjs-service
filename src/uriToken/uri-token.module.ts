import { Module } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { UriTokenController } from './uri-token.controller';
import { UriTokenService } from './uri-token.service';

@Module({
  controllers: [UriTokenController],
  providers: [UriTokenService, XrplService],
})
export class UriTokenModule {}
