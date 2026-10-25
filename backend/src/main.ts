import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { expectedKey } from './common/admin-key.guard';
import { configureApp } from './setup';

// Local development convenience: backend/.env fills in variables that aren't already
// set. Production (Railway, Docker) uses the real environment instead.
const envFile = join(__dirname, '..', '.env');
if (process.env.NODE_ENV !== 'production' && existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

async function bootstrap() {
  // Fail at startup (not on the first admin request) if the key is missing in production
  expectedKey();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  app.enableShutdownHooks();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Portfolio API running on http://localhost:${port}/api`);
}
bootstrap();
