import { Module } from '@nestjs/common';
import { HookModule } from './hooks/hook.module';
import { UriTokenModule } from './uriToken/uri-token.module';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { RentalModule } from './rentals/rental.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HookModule, UriTokenModule, AccountModule, RentalModule],
})
export class AppModule {}
