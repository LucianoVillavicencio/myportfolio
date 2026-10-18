import { NotFoundException } from '@nestjs/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveStaticDir } from '../config';
import type { ProfileService } from '../profile/profile.service';
import type { ProjectsService } from '../projects/projects.service';
import { buildMeta, escapeXml } from './seo';

const START = '<!--seo:start-->';
const END = '<!--seo:end-->';
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface Shell {
  before: string;
  after: string;
}

/** Parses index.html around the seo markers; null when unusable. */
function loadShell(dir: string): Shell | null {
  try {
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    const a = html.indexOf(START);
    const b = html.indexOf(END);
    if (a === -1 || b < a) return null;
    return { before: html.slice(0, a + START.length), after: html.slice(b) };
  } catch {
    return null;
  }
}

export function createSeoMiddleware(
  projects: ProjectsService,
  profiles: ProfileService,
): RequestHandler {
  // Cached per static dir; read lazily (tests change STATIC_DIR before import).
  const shells = new Map<string, Shell | null>();
  const shellFor = (): Shell | null => {
    const dir = resolveStaticDir(process.env);
    if (!shells.has(dir)) shells.set(dir, loadShell(dir));
    return shells.get(dir) ?? null;
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      const path = req.path;
      if (path === '/api' || path.startsWith('/api/')) return next();
      const origin = `${req.protocol}://${req.get('host')}`;

      if (path === '/robots.txt') {
        res
          .type('text/plain')
          .send(
            `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`,
          );
        return;
      }
      if (path === '/sitemap.xml') {
        const list = await projects.findAll();
        const urls = [
          { loc: '/', lastmod: undefined as Date | undefined },
          { loc: '/books', lastmod: undefined },
          ...list
            .filter((p) => p.slug)
            .map((p) => ({ loc: `/projects/${p.slug}`, lastmod: p.createdAt })),
        ];
        const body = urls
          .map(
            (u) =>
              `  <url><loc>${escapeXml(origin + u.loc)}</loc>` +
              (u.lastmod
                ? `<lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>`
                : '') +
              '</url>',
          )
          .join('\n');
        res
          .type('application/xml')
          .send(
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
          );
        return;
      }

      const projectMatch = /^\/projects\/([^/]+)\/?$/.exec(path);
      const isPage = path === '/' || path === '/books' || projectMatch;
      if (!isPage || !req.accepts('html')) return next();
      const shell = shellFor();
      if (!shell) return next();

      const profile = await profiles.get();
      const base = { origin, lang: 'es' as const, profile };
      let status = 200;
      let meta: string;
      if (projectMatch) {
        const slug = decodeURIComponentSafe(projectMatch[1]);
        let project;
        if (SLUG.test(slug)) {
          try {
            project = await projects.findBySlug(slug);
          } catch (e) {
            if (!(e instanceof NotFoundException)) throw e;
          }
        }
        if (project) {
          meta = buildMeta({ ...base, path: `/projects/${slug}`, project });
        } else {
          status = 404;
          meta = buildMeta({ ...base, path: '/', notFound: true });
        }
      } else {
        meta = buildMeta({ ...base, path });
      }
      res
        .status(status)
        .set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        })
        .send(`${shell.before}\n    ${meta}\n    ${shell.after}`);
    } catch (e) {
      next(e);
    }
  };
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return '';
  }
}
