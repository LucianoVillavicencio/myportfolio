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

  it('locks out an ip after repeated wrong keys on any admin route', async () => {
    const { MAX_FAILED_ATTEMPTS } = await import('../src/common/admin-key.guard');
    const backup = (key: string) =>
      request(app.getHttpServer())
        .get('/api/backup')
        .set('x-admin-key', key)
        .set('X-Forwarded-For', '5.5.5.5');
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      expect((await backup('wrong')).status).toBe(401);
    }
    expect((await backup('wrong')).status).toBe(429);
    // Even the right key is refused until the window passes.
    expect((await backup('test-key')).status).toBe(429);
  });

  it('backup is a zip with db, cv and media', async () => {
    const { unzipSync } = await import('fflate');
    const server = app.getHttpServer();
    const pdf = Buffer.from('%PDF-1.7\nbackup cv\n');
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);
    const cv = await request(server)
      .put('/api/cv/es')
      .set('x-admin-key', 'test-key')
      .set('X-Forwarded-For', '6.6.6.6')
      .attach('file', pdf, 'cv.pdf');
    expect(cv.status).toBeLessThan(300);
    const up = await request(server)
      .post('/api/media')
      .set('x-admin-key', 'test-key')
      .set('X-Forwarded-For', '6.6.6.6')
      .attach('file', png, 'a.png');
    expect(up.status).toBe(201);
    const mediaName = (up.body.url as string).split('/').pop() as string;

    const res = await request(server)
      .get('/api/backup')
      .set('x-admin-key', 'test-key')
      .set('X-Forwarded-For', '6.6.6.6')
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/zip/);
    expect(res.headers['content-disposition']).toMatch(
      /portfolio-\d{4}-\d{2}-\d{2}\.zip/,
    );
    const files = unzipSync(new Uint8Array(res.body as Buffer));
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(['portfolio.sqlite', 'cv/cv_es.pdf', `media/${mediaName}`]),
    );
    expect(Buffer.from(files['portfolio.sqlite']).subarray(0, 15).toString()).toBe(
      'SQLite format 3',
    );
    expect(Buffer.from(files['cv/cv_es.pdf']).equals(pdf)).toBe(true);
    expect(Buffer.from(files[`media/${mediaName}`]).equals(png)).toBe(true);
    // Leave no upload behind: the CV tests below expect none.
    rmSync(join(cvDir, 'cv_es.pdf'), { force: true });
  });

  describe('timeline', () => {
    const entry = { kind: 'work', period: '2020', sortYear: 2020, titleEn: 'Job' };
    const ip = '7.7.7.7';

    it('rejects an unknown kind with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/timeline')
        .set('x-forwarded-for', ip)
        .set('x-admin-key', 'test-key')
        .send({ ...entry, kind: 'hobby' });
      expect(res.status).toBe(400);
    });

    it('treats null text fields as empty instead of 500', async () => {
      const h = { 'x-forwarded-for': '7.7.7.8', 'x-admin-key': 'test-key' };
      const created = await request(app.getHttpServer())
        .post('/api/timeline')
        .set(h)
        .send({ ...entry, titleEs: 'Trabajo', descriptionEs: null });
      expect(created.status).toBe(201);
      const patched = await request(app.getHttpServer())
        .patch(`/api/timeline/${created.body.id}`)
        .set(h)
        .send({ titleEn: null });
      expect(patched.status).toBe(200);
      expect(patched.body.titleEn).toBe('');
    });

    it('rejects null kind, period and sortYear on PATCH with 400', async () => {
      const h = { 'x-forwarded-for': '7.7.7.9', 'x-admin-key': 'test-key' };
      const created = await request(app.getHttpServer())
        .post('/api/timeline')
        .set(h)
        .send(entry);
      for (const field of ['kind', 'period', 'sortYear']) {
        const res = await request(app.getHttpServer())
          .patch(`/api/timeline/${created.body.id}`)
          .set(h)
          .send({ [field]: null });
        expect(res.status).toBe(400);
      }
      const ok = await request(app.getHttpServer())
        .patch(`/api/timeline/${created.body.id}`)
        .set(h)
        .send({ period: '2021' });
      expect(ok.status).toBe(200);
    });

    it('requires the admin key to write, lists publicly', async () => {
      const denied = await request(app.getHttpServer())
        .post('/api/timeline')
        .set('x-forwarded-for', ip)
        .send(entry);
      expect(denied.status).toBe(401);
      const created = await request(app.getHttpServer())
        .post('/api/timeline')
        .set('x-forwarded-for', ip)
        .set('x-admin-key', 'test-key')
        .send(entry);
      expect(created.status).toBe(201);
      const list = await request(app.getHttpServer()).get('/api/timeline');
      expect(list.status).toBe(200);
      expect(list.body.some((e: { id: string }) => e.id === created.body.id)).toBe(true);
      const del = await request(app.getHttpServer())
        .delete(`/api/timeline/${created.body.id}`)
        .set('x-forwarded-for', ip)
        .set('x-admin-key', 'test-key');
      expect(del.status).toBe(204);
    });
  });

  describe('support', () => {
    const h = (ip: string) => ({ 'x-forwarded-for': ip, 'x-admin-key': 'test-key' });

    it('public GET hides a disabled card with the documented shape', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/support')
        .set('x-forwarded-for', '9.9.9.1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ card: null, stories: [] });
    });

    it('rejects null enabled with 400, treats null text as empty', async () => {
      const bad = await request(app.getHttpServer())
        .patch('/api/support')
        .set(h('9.9.9.2'))
        .send({ enabled: null });
      expect(bad.status).toBe(400);
      const ok = await request(app.getHttpServer())
        .patch('/api/support')
        .set(h('9.9.9.2'))
        .send({ introEn: null });
      expect(ok.status).toBe(200);
      expect(ok.body.introEn).toBe('');
    });

    it('guards admin routes, rejects null sortOrder', async () => {
      const denied = await request(app.getHttpServer())
        .get('/api/support/admin')
        .set('x-forwarded-for', '9.9.9.3');
      expect(denied.status).toBe(401);
      const full = await request(app.getHttpServer())
        .get('/api/support/admin')
        .set(h('9.9.9.3'));
      expect(full.status).toBe(200);
      expect(full.body.card.enabled).toBe(false);
      const story = await request(app.getHttpServer())
        .post('/api/support/stories')
        .set(h('9.9.9.3'))
        .send({ titleEn: 'Fixed a LAN', sortOrder: null });
      expect(story.status).toBe(400);
    });
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
  describe('contact', () => {
    const valid = {
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hola, me gustaria hablar contigo.',
    };
    const saved = { ...process.env };
    let n = 0;
    let fetchSpy: jest.SpyInstance;
    const post = (body: object, ip = `10.11.0.${++n}`) =>
      request(app.getHttpServer())
        .post('/api/contact')
        .set('X-Forwarded-For', ip)
        .send(body);

    beforeEach(() => {
      fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue({ ok: true, status: 200 } as Response);
    });
    afterEach(() => {
      fetchSpy.mockRestore();
      for (const k of ['RESEND_API_KEY', 'CONTACT_FROM', 'CONTACT_TO']) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    });

    it('sends via Resend', async () => {
      process.env.RESEND_API_KEY = 're_test';
      const res = await post(valid);
      expect(res.status).toBe(204);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      expect(init.headers.Authorization).toBe('Bearer re_test');
      const body = JSON.parse(init.body);
      expect(body.reply_to).toBe('ada@example.com');
      expect(body.subject).toBe('Portfolio: mensaje de Ada');
      expect(body.text).toContain('Ada');
      expect(body.text).toContain(valid.message);
    });

    it('honeypot drops silently', async () => {
      process.env.RESEND_API_KEY = 're_test';
      const res = await post({ ...valid, website: 'x' });
      expect(res.status).toBe(204);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('validates input', async () => {
      process.env.RESEND_API_KEY = 're_test';
      expect((await post({ ...valid, email: 'nope' })).status).toBe(400);
      expect((await post({ ...valid, message: 'short' })).status).toBe(400);
      expect((await post({ ...valid, name: null })).status).toBe(400);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('503 when not configured', async () => {
      delete process.env.RESEND_API_KEY;
      const res = await post(valid);
      expect(res.status).toBe(503);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('503 when Resend fails', async () => {
      process.env.RESEND_API_KEY = 're_test';
      fetchSpy.mockResolvedValue({ ok: false, status: 500 } as Response);
      const res = await post(valid);
      expect(res.status).toBe(503);
    });

    it('strips control characters from the subject', async () => {
      process.env.RESEND_API_KEY = 're_test';
      const res = await post({ ...valid, name: 'Ada\r\nBcc: x@y.z' });
      expect(res.status).toBe(204);
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.subject).not.toMatch(/[\r\n]/);
      expect(body.subject).toBe('Portfolio: mensaje de Ada Bcc: x@y.z');
    });

    it('503 when fetch rejects', async () => {
      process.env.RESEND_API_KEY = 're_test';
      fetchSpy.mockRejectedValue(new Error('network'));
      expect((await post(valid)).status).toBe(503);
    });

    it('throttles to 3 per 10 minutes', async () => {
      process.env.RESEND_API_KEY = 're_test';
      const ip = '10.99.0.1';
      for (let i = 0; i < 3; i++) {
        expect((await post(valid, ip)).status).toBe(204);
      }
      expect((await post(valid, ip)).status).toBe(429);
    });
  });
});
