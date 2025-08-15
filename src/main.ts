import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cors from 'cors';
import { AppModule } from './app.module';
import { env } from './config/env/env';
import { setupSwagger } from './config/swagger/swagger.config';
import { CLIENT_URL, GLOBAL_PREFIX } from './utils/constants';

const number: string = 2;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.use(
    cors({
      origin: CLIENT_URL,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: 'Content-Type, Authorization',
      credentials: true,
    }),
  );

  const port = env().PORT;

  // swagger
  setupSwagger(app);

  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`,
  );
}

bootstrap();
