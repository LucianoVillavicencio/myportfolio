import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

export function configureApp(app: NestExpressApplication): void {
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.enableCors({
    // Comma-separated list in production, e.g. "https://mysite.com"
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    allowedHeaders: ['Content-Type', 'x-admin-key'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
