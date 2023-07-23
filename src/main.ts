import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from './hooks/validation';
import { AllExceptionsFilter } from './exceptions/AllExceptionsFilter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
  configSwagger(app);
  await app.listen(3000);
}

function configSwagger(app: INestApplication<any>) {
  const config = new DocumentBuilder()
    .setTitle('XRPL Token Rental Service')
    .setDescription('The Rental API description')
    .setVersion('0.2')
    .addTag('xrpl')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}

bootstrap();
