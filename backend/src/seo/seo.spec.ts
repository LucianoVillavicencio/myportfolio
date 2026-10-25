import { buildMeta } from './seo';
import type { Profile } from '../profile/profile.entity';
import type { Project } from '../projects/project.entity';

const profile = {
  name: 'Luciano Villavicencio',
  location: 'Rosario',
  rolesEs: 'Desarrollador\nRedes',
  rolesEn: 'Developer',
  leadHighlightEs: 'Estudiante.',
  leadTextEs: 'Hago cosas.',
  leadHighlightEn: '',
  leadTextEn: '',
  email: 'me@example.com',
  githubUrl: 'https://github.com/x',
  linkedinUrl: null,
  instagramUrl: 'https://instagram.com/x',
} as Profile;

const base = { origin: 'https://site.dev', lang: 'es' as const, profile };

describe('buildMeta', () => {
  it('escapes html in titles', () => {
    const project = { title: '<b>&"x', summaryEs: 'hola', images: [] } as unknown as Project;
    const html = buildMeta({ ...base, path: '/projects/x', project });
    expect(html).toContain('&lt;b&gt;&amp;&quot;x');
    expect(html).not.toContain('<b>');
  });

  it('uses first screenshot as og:image with absolute url', () => {
    const project = {
      title: 'P',
      summaryEs: 'a',
      images: ['/api/media/a.png', '/api/media/b.png'],
    } as unknown as Project;
    const html = buildMeta({ ...base, path: '/projects/p', project });
    expect(html).toContain('property="og:image" content="https://site.dev/api/media/a.png"');
    expect(html).toContain('rel="canonical" href="https://site.dev/projects/p"');
  });

  it('never throws on a malformed origin', () => {
    const bad = { ...base, origin: 'http://bad host' };
    expect(() => buildMeta({ ...bad, path: '/' })).not.toThrow();
    const project = { title: 'P', summaryEs: 'a', images: ['/api/media/a.png'] } as unknown as Project;
    expect(buildMeta({ ...bad, path: '/projects/p', project })).toContain(
      'property="og:image" content="http://bad host/api/media/a.png"',
    );
  });

  it('falls back to /og-image.png', () => {
    expect(buildMeta({ ...base, path: '/' })).toContain(
      'content="https://site.dev/og-image.png"',
    );
  });

  it('home includes Person JSON-LD with sameAs', () => {
    const html = buildMeta({ ...base, path: '/' });
    const json = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)![1];
    const data = JSON.parse(json);
    expect(data['@type']).toBe('Person');
    expect(data.jobTitle).toBe('Desarrollador');
    expect(data.email).toBe('mailto:me@example.com');
    expect(data.sameAs).toEqual(['https://github.com/x', 'https://instagram.com/x']);
  });

  it('keeps a hostile title from closing the JSON-LD script', () => {
    const html = buildMeta({
      ...base,
      path: '/',
      profile: { ...profile, name: '</script><i>' } as Profile,
    });
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });

  it('marks unknown pages noindex', () => {
    expect(buildMeta({ ...base, path: '/projects/zz', notFound: true })).toContain(
      '<meta name="robots" content="noindex" />',
    );
  });
});
