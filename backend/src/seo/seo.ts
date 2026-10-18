import type { Profile } from '../profile/profile.entity';
import type { Project } from '../projects/project.entity';

export interface MetaInput {
  origin: string;
  path: string;
  lang: 'es' | 'en';
  profile: Profile;
  project?: Project;
  /** Unknown route: generic meta plus noindex. */
  notFound?: boolean;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeXml(value: string): string {
  return escapeHtml(value).replace(/&#39;/g, '&apos;');
}

/** First paragraph, cut to ~160 chars on a word boundary. */
export function describe(text: string, max = 160): string {
  const first = (text.split(/\n{2,}/)[0] ?? '').replace(/\s+/g, ' ').trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?-]+$/, '')}…`;
}

function pick(lang: 'es' | 'en', es: string, en: string): string {
  const [first, second] = lang === 'es' ? [es, en] : [en, es];
  return first.trim() ? first : second;
}

/** Resolves `ref` against `origin`; a malformed origin degrades to concatenation instead of throwing. */
function absoluteUrl(ref: string, origin: string): string {
  try {
    return new URL(ref, origin).href;
  } catch {
    try {
      return new URL(ref).href;
    } catch {
      return origin + (ref.startsWith('/') ? ref : `/${ref}`);
    }
  }
}

export function buildMeta(input: MetaInput): string {
  const { origin, path, lang, profile, project, notFound } = input;
  const name = profile.name;
  const home = pick(
    lang,
    `${profile.leadHighlightEs} ${profile.leadTextEs}`,
    `${profile.leadHighlightEn} ${profile.leadTextEn}`,
  );

  let title = name;
  let description = describe(home);
  if (notFound) {
    title = `${name} · 404`;
  } else if (project) {
    title = `${project.title} · ${name}`;
    description = describe(pick(lang, project.summaryEs, project.summaryEn)) || description;
  } else if (path === '/books') {
    title = `${lang === 'es' ? 'Libros' : 'Books'} · ${name}`;
    description =
      lang === 'es'
        ? `Registro de lecturas de ${name}.`
        : `${name}'s reading log.`;
  }

  const image = absoluteUrl(project?.images?.[0] || '/og-image.png', origin);
  const url = origin + path;
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const lines = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:type" content="${project ? 'article' : 'website'}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];
  if (!notFound) {
    lines.splice(
      2,
      0,
      `<link rel="canonical" href="${escapeHtml(url)}" />`,
    );
    lines.push(`<meta property="og:url" content="${escapeHtml(url)}" />`);
  }
  if (notFound) lines.push('<meta name="robots" content="noindex" />');
  if (path === '/' && !notFound) {
    const roles = pick(lang, profile.rolesEs, profile.rolesEn);
    const jobTitle = roles.split('\n')[0]?.trim();
    const sameAs = [profile.githubUrl, profile.linkedinUrl, profile.instagramUrl].filter(
      (u): u is string => !!u,
    );
    const person: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      url: origin + '/',
    };
    if (jobTitle) person.jobTitle = jobTitle;
    if (profile.email) person.email = `mailto:${profile.email}`;
    if (sameAs.length) person.sameAs = sameAs;
    // Escape < so no value can close the script tag.
    const json = JSON.stringify(person).replace(/</g, '\x5cu003c');
    lines.push(`<script type="application/ld+json">${json}</script>`);
  }
  return lines.join('\n    ');
}
