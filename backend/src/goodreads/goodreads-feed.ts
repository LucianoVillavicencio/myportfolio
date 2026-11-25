import { XMLParser } from 'fast-xml-parser';
import { ReadingStatus } from '../books/book.entity';

export type GoodreadsShelf = 'currently-reading' | 'read' | 'to-read';

/** In precedence order: a book on several shelves takes the first match. */
export const GOODREADS_SHELVES: GoodreadsShelf[] = [
  'currently-reading',
  'read',
  'to-read',
];

export const SHELF_STATUS: Record<GoodreadsShelf, ReadingStatus> = {
  'currently-reading': 'READING',
  read: 'COMPLETED',
  'to-read': 'WANT_TO_READ',
};

export interface GoodreadsItem {
  goodreadsId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  status: ReadingStatus;
  rating: number | null;
  thoughts: string | null;
  totalPages: number | null;
  dateAdded: Date | null;
  readAt: Date | null;
}

export class GoodreadsFeedError extends Error {}

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  isArray: (name) => name === 'item',
});

const text = (value: unknown): string =>
  value === undefined || value === null ? '' : String(value).trim();

function cleanCover(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const url = text(candidate);
    if (url && !url.includes('nophoto')) return url;
  }
  return null;
}

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) {
      const cp = parseInt(code.slice(2), 16);
      return Number.isNaN(cp) ? match : String.fromCodePoint(cp);
    }
    if (code.startsWith('#')) {
      const cp = parseInt(code.slice(1), 10);
      return Number.isNaN(cp) ? match : String.fromCodePoint(cp);
    }
    return ENTITY_MAP[code.toLowerCase()] ?? match;
  });
}

export function cleanReview(html: string | undefined): string | null {
  if (!html) return null;
  const cleaned = decodeHtmlEntities(
    html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''),
  ).trim();
  return cleaned || null;
}

/** Upgrades a Goodreads thumbnail URL (e.g. `._SY75_.jpg`) to the full-size cover. */
function upgradeCoverUrl(url: string): string {
  return url.replace(/\._[A-Z0-9_]+_(?=\.[a-z]+$)/i, '');
}

function unescapeWidgetJs(raw: string): string {
  const match = raw.match(/var\s+widget_code\s*=\s*'((?:\\.|[^'\\])*)'/);
  if (!match) return raw;
  return match[1].replace(/\\(.)/g, (_m, ch: string) => {
    switch (ch) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      default:
        return ch;
    }
  });
}

/**
 * Parses the HTML returned by Goodreads' `/review/custom_widget/{userId}` endpoint.
 * Goodreads retired its RSS feeds in Oct 2026 and login-gates `/review/list/`.
 */
export function parseShelfWidget(
  raw: string,
  shelf: GoodreadsShelf,
): GoodreadsItem[] {
  const html = unescapeWidgetJs(raw);
  if (!/class="gr_custom_container_[a-z0-9_-]*"/i.test(html)) {
    throw new GoodreadsFeedError(
      'Goodreads profile is private, invalid, or unavailable',
    );
  }

  const returnedShelf = html.match(/\/review\/list\/[^"'\s]*[?&]shelf=([a-z0-9_-]+)/i)?.[1];
  if (returnedShelf && returnedShelf.toLowerCase() !== shelf) {
    throw new GoodreadsFeedError(
      `Goodreads returned shelf "${returnedShelf}" instead of "${shelf}"`,
    );
  }

  const chunks = html
    .split(/<div\s+class="gr_custom_each_container_[a-z0-9_-]*">/i)
    .slice(1);
  const items: GoodreadsItem[] = [];

  for (const chunk of chunks) {
    const coverImg = chunk.match(
      /<div\s+class="gr_custom_book_container_[a-z0-9_-]*"[\s\S]*?<img[^>]*\bsrc="([^"]+)"/i,
    )?.[1];
    const coverUrl = coverImg
      ? cleanCover(upgradeCoverUrl(decodeHtmlEntities(coverImg)))
      : null;

    const bookIdFromCover = coverImg?.match(
      /\/(\d+)(?:\._[A-Z0-9_]+_)?\.(?:jpg|jpeg|png|gif|webp)(?:\?|$)/i,
    )?.[1];
    const reviewId = chunk.match(/\/review\/show\/(\d+)/i)?.[1];
    const goodreadsId = bookIdFromCover ?? (reviewId ? `review:${reviewId}` : '');
    if (!goodreadsId) continue;

    const fullTitleAttr = chunk.match(
      /<div\s+class="gr_custom_book_container_[a-z0-9_-]*"[\s\S]*?<a[^>]*\btitle="([^"]+)"/i,
    )?.[1];
    const shortTitle = chunk.match(
      /<div\s+class="gr_custom_title_[a-z0-9_-]*"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    )?.[1];
    const title = decodeHtmlEntities((fullTitleAttr ?? shortTitle ?? '').trim());
    if (!title) continue;

    const authorRaw = chunk.match(
      /<div\s+class="gr_custom_author_[a-z0-9_-]*"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    )?.[1];
    const author = decodeHtmlEntities((authorRaw ?? '').trim());

    const ratingBlock = chunk.match(
      /<div\s+class="gr_custom_rating_[a-z0-9_-]*"[\s\S]*?<\/div>/i,
    )?.[0];
    const activeStars = ratingBlock
      ? (ratingBlock.match(/gr_flat_red_star_active/gi) ?? []).length
      : 0;

    const reviewBlock = chunk.match(
      /<div\s+class="gr_custom_review_[a-z0-9_-]*">([\s\S]*?)<\/div>/i,
    )?.[1];

    items.push({
      goodreadsId,
      title,
      author,
      coverUrl,
      status: SHELF_STATUS[shelf],
      rating: activeStars > 0 ? Math.min(activeStars, 5) : null,
      thoughts: cleanReview(reviewBlock),
      totalPages: null,
      dateAdded: null,
      readAt: null,
    });
  }

  return items;
}

export function extractGoodreadsUserId(input: string): string | null {
  const value = input.trim();
  if (/^\d+$/.test(value)) return value;
  const match = value.match(/user\/show\/(\d+)/);
  return match ? match[1] : null;
}

export function parseShelfFeed(
  xml: string,
  shelf: GoodreadsShelf,
): GoodreadsItem[] {
  let doc: any;
  try {
    doc = parser.parse(xml);
  } catch (err) {
    throw new GoodreadsFeedError(`Invalid Goodreads feed: ${(err as Error).message}`);
  }
  const channel = doc?.rss?.channel;
  if (!channel || typeof channel !== 'object') {
    throw new GoodreadsFeedError('Response is not a Goodreads RSS feed');
  }

  const items: any[] = channel.item ?? [];
  return items.map((item) => {
    const rating = parseInt(text(item.user_rating), 10);
    const pages = parseInt(text(item.book?.num_pages), 10);
    const added = text(item.user_date_added);
    const addedDate = added ? new Date(added) : null;
    const read = text(item.user_read_at);
    const readDate = read ? new Date(read) : null;
    return {
      goodreadsId: text(item.book_id),
      title: text(item.title),
      author: text(item.author_name),
      coverUrl: cleanCover(item.book_large_image_url, item.book_image_url),
      status: SHELF_STATUS[shelf],
      rating: rating > 0 ? rating : null,
      thoughts: cleanReview(text(item.user_review)),
      totalPages: pages > 0 ? pages : null,
      dateAdded: addedDate && !isNaN(addedDate.getTime()) ? addedDate : null,
      readAt: readDate && !isNaN(readDate.getTime()) ? readDate : null,
    };
  });
}
