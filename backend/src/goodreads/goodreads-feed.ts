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

export function cleanReview(html: string | undefined): string | null {
  if (!html) return null;
  const cleaned = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
  return cleaned || null;
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
    };
  });
}
