import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HookModule } from './hooks/hook.module';

@Module({
  imports: [HookModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
