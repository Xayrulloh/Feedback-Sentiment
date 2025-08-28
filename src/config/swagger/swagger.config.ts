import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { patchNestJsSwagger } from 'nestjs-zod';

export function setupSwagger(app: INestApplication): void {
  app.use(
    '/docs',
    basicAuth({
      challenge: true,
      users: {
        admin: 'password',
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Feedback Sentiment API Docs')
    .setDescription(
      'Here you can see all the endpoints with request/response examples',
    )
    .addBearerAuth()
    .build();

  patchNestJsSwagger();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true,
    },
  });
}
