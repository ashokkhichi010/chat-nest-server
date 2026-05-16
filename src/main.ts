import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as morgan from 'morgan';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle('NexChat & TradeSmart API')
    .setDescription('Unified API for Real-time Communication, Gaming, and Financial Trading Simulation.')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addTag('chat')
    .addTag('games')
    .addTag('trading')
    .addBearerAuth()
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => methodKey
  };

  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, document);

  app.use(morgan('dev'));
  await app.listen(new ConfigService().get("PORT"));
}

bootstrap();