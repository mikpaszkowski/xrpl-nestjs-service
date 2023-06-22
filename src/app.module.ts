import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HookModule } from './hooks/hook.module';
import { UriTokenModule } from './uriToken/uri-token.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HookModule, UriTokenModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
