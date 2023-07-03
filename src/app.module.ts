import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HookModule } from './hooks/hook.module';
import { UriTokenModule } from './uriToken/uri-token.module';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { RentalModule } from './rentals/rental.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HookModule, UriTokenModule, AccountModule, RentalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
