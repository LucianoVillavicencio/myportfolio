import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { expectedKey } from './common/admin-key.guard';
import { configureApp } from './setup';

async function bootstrap() {
  // Fail at startup (not on the first admin request) if the key is missing in production
  expectedKey();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Portfolio API running on http://localhost:${port}/api`);
}
bootstrap();
