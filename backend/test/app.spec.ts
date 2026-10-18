import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as request from 'supertest';

describe('App (full module)', () => {
  let app: NestExpressApplication;
  const dbPath = join(tmpdir(), `portfolio-app-spec-${process.pid}.sqlite`);
  const cvDir = mkdtempSync(join(tmpdir(), 'portfolio-cv-spec-'));
  const mediaDir = mkdtempSync(join(tmpdir(), 'portfolio-media-app-spec-'));

  beforeAll(async () => {
    process.env.DB_PATH = dbPath;
    process.env.STATIC_DIR = join(__dirname, 'fixtures', 'static');
    process.env.ADMIN_API_KEY = 'test-key';
    process.env.CV_DIR = cvDir;
    process.env.MEDIA_DIR = mediaDir;
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
    rmSync(cvDir, { recursive: true, force: true });
    rmSync(mediaDir, { recursive: true, force: true });
  });

  describe('media', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

    it('media upload requires admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/media')
        .attach('file', png, 'a.png');
      expect(res.status).toBe(401);
    });

    it('serves uploaded media', async () => {
      const up = await request(app.getHttpServer())
        .post('/api/media')
        .set('x-admin-key', 'test-key')
        .attach('file', png, 'a.png');
      expect(up.status).toBe(201);
      const res = await request(app.getHttpServer()).get(up.body.url);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/png/);
      expect(res.headers['cache-control']).toContain('immutable');
    });

    it('rejects a disguised non-image with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/media')
        .set('x-admin-key', 'test-key')
        .attach('file', Buffer.from('<html></html>'), 'a.png');
      expect(res.status).toBe(400);
    });

    it('rejects traversal', async () => {
      const res = await request(app.getHttpServer()).get('/api/media/..%2Fportfolio.sqlite');
      expect(res.status).toBe(404);
    });
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

  it('sets security headers', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('allows object-src self for the PDF viewer', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.headers['content-security-policy']).toContain(
      "object-src 'self'",
    );
  });

  it('throttles auth verify', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/verify')
        .set('x-admin-key', 'wrong')
        .set('X-Forwarded-For', '1.1.1.1');
    for (let i = 0; i < 5; i++) {
      expect((await attempt()).status).toBe(401);
    }
    expect((await attempt()).status).toBe(429);
  });

  it('throttles per forwarded client ip', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/verify')
      .set('x-admin-key', 'wrong')
      .set('X-Forwarded-For', '2.2.2.2');
    expect(res.status).toBe(401);
  });

  it('api still works', async () => {
    const res = await request(app.getHttpServer()).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  it('backup requires the admin key', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/backup')
      .set('X-Forwarded-For', '3.3.3.3');
    expect(res.status).toBe(401);
  });

  it('backup returns the sqlite file', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/backup')
      .set('x-admin-key', 'test-key')
      .set('X-Forwarded-For', '3.3.3.3')
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(
      /portfolio-\d{4}-\d{2}-\d{2}\.sqlite/,
    );
    expect((res.body as Buffer).subarray(0, 15).toString()).toBe(
      'SQLite format 3',
    );
  });

  describe('CVs', () => {
    const pdf = Buffer.from('%PDF-1.7\nuploaded cv\n');
    const binary = (r: request.Request) =>
      r.buffer(true).parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    const upload = (lang: string, body: Buffer, key = 'test-key') =>
      request(app.getHttpServer())
        .put(`/api/cv/${lang}`)
        .set('x-admin-key', key)
        .set('X-Forwarded-For', '4.4.4.4')
        .attach('file', body, 'cv.pdf');

    it('404s when neither an upload nor a bundled PDF exists', async () => {
      const res = await request(app.getHttpServer()).get('/api/cv/es');
      expect(res.status).toBe(404);
    });

    it('falls back to the bundled PDF', async () => {
      const res = await binary(request(app.getHttpServer()).get('/api/cv/en'));
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect((res.body as Buffer).toString()).toContain('bundled fixture');
    });

    it('rejects unknown languages', async () => {
      const res = await request(app.getHttpServer()).get('/api/cv/fr');
      expect(res.status).toBe(400);
    });

    it('upload requires the admin key', async () => {
      expect((await upload('es', pdf, 'wrong')).status).toBe(401);
    });

    it('rejects files that are not PDFs', async () => {
      const res = await upload('es', Buffer.from('<html>nope</html>'));
      expect(res.status).toBe(400);
    });

    it('serves the uploaded PDF and reports it in the status', async () => {
      const put = await upload('es', pdf);
      expect(put.status).toBe(200);
      expect(put.body).toMatchObject({ source: 'upload', size: pdf.length });

      const res = await binary(request(app.getHttpServer()).get('/api/cv/es'));
      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-cache');
      expect((res.body as Buffer).equals(pdf)).toBe(true);

      const status = await request(app.getHttpServer())
        .get('/api/cv')
        .set('x-admin-key', 'test-key');
      expect(status.body.es).toMatchObject({ source: 'upload' });
      expect(status.body.en).toMatchObject({ source: 'bundled' });
    });

    it('redirects the old static CV links', async () => {
      const res = await request(app.getHttpServer()).get('/cv_es.pdf');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/api/cv/es');
    });
  });
});
