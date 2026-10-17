import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Portfolio API running on http://localhost:${port}/api`);
}
bootstrap();
