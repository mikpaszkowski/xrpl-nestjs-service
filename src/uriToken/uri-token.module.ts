import { Module } from '@nestjs/common';
import { XrplService } from '../xrpl/client/client.service';
import { UriTokenController } from './uri-token.controller';
import { URITokenService } from './uri-token-service.service';

@Module({
  controllers: [UriTokenController],
  providers: [URITokenService, XrplService],
})
export class UriTokenModule {}
