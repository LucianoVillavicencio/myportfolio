import { ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

export function configureApp(app: NestExpressApplication): void {
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          // Covers and project images are arbitrary https URLs.
          imgSrc: ["'self'", 'data:', 'https:'],
          // Chrome's built-in PDF viewer (CV downloads) needs object/embed from self.
          objectSrc: ["'self'"],
          connectSrc: ["'self'", 'https://openlibrary.org'],
        },
      },
    }),
  );
  // Old CV links pointed at the bundled static PDFs; send them to the
  // endpoint that serves the admin-uploaded version.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const lang = /^\/cv_(es|en)\.pdf$/.exec(req.path)?.[1];
    if (lang) res.redirect(302, `/api/cv/${lang}`);
    else next();
  });
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
