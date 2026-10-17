import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as request from 'supertest';

describe('App (full module)', () => {
  let app: NestExpressApplication;
  const dbPath = join(tmpdir(), `portfolio-app-spec-${process.pid}.sqlite`);

  beforeAll(async () => {
    process.env.DB_PATH = dbPath;
    process.env.STATIC_DIR = join(__dirname, 'fixtures', 'static');
    process.env.ADMIN_API_KEY = 'test-key';
    // Env is read at module load, so import after setting it.
    const { AppModule } = await import('../src/app.module');
    const { configureApp } = await import('../src/setup');
    // NestFactory (like main.ts), not Test.createTestingModule: ServeStaticModule
    // needs the HTTP adapter at provider creation and would no-op otherwise.
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
    });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (existsSync(dbPath)) rmSync(dbPath);
  });

  it('health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it.each(['/books', '/admin'])(
    'serves index.html for client route %s',
    async (path) => {
      const res = await request(app.getHttpServer()).get(path);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('id="root"');
    },
  );

  it('unknown api routes are JSON 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('api still works', async () => {
    const res = await request(app.getHttpServer()).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
