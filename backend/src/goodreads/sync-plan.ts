import { Book, SYNCED_FIELDS, SyncedField } from '../books/book.entity';
import { GoodreadsItem } from './goodreads-feed';

export interface SyncPlan {
  create: Partial<Book>[];
  update: { id: string; changes: Partial<Book> }[];
  remove: string[];
}

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
}

export class EmptyFeedError extends Error {}

export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*\([^)]*\)$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Synced fields where the book differs from the feed. A null feed totalPages is ignored. */
function differingFields(item: GoodreadsItem, book: Book): SyncedField[] {
  return SYNCED_FIELDS.filter((field) => {
    if (field === 'finishedAt') {
      // A feed without a read date never wipes a date set by hand.
      if (item.readAt === null) return false;
      return book.finishedAt?.getTime() !== item.readAt.getTime();
    }
    const value = item[field];
    if (field === 'totalPages' && value === null) return false;
    return book[field] !== value;
  });
}

export function planSync(
  feed: GoodreadsItem[],
  books: Book[],
  dismissedIds: string[],
): SyncPlan {
  const plan: SyncPlan = { create: [], update: [], remove: [] };
  const goodreadsBooks = books.filter((b) => b.goodreadsId !== null);

  if (feed.length === 0) {
    if (goodreadsBooks.length > 0) {
      throw new EmptyFeedError('Goodreads feed is empty; refusing to remove synced books');
    }
    return plan;
  }

  const byGoodreadsId = new Map(goodreadsBooks.map((b) => [b.goodreadsId as string, b]));
  const dismissed = new Set(dismissedIds);
  const adoptable = books.filter((b) => b.goodreadsId === null);
  const adopted = new Set<string>();

  for (const item of feed) {
    if (dismissed.has(item.goodreadsId)) continue;

    const existing = byGoodreadsId.get(item.goodreadsId);
    if (existing) {
      const locked = existing.lockedFields ?? [];
      const changes: Record<string, unknown> = {};
      for (const field of differingFields(item, existing)) {
        if (!locked.includes(field)) {
          changes[field] = field === 'finishedAt' ? item.readAt : item[field];
        }
      }
      if (Object.keys(changes).length > 0) {
        plan.update.push({ id: existing.id, changes: changes as Partial<Book> });
      }
      continue;
    }

    const title = normalizeForMatch(item.title);
    const author = normalizeForMatch(item.author);
    const match = adoptable.find(
      (b) =>
        !adopted.has(b.id) &&
        normalizeForMatch(b.title) === title &&
        normalizeForMatch(b.author) === author,
    );
    if (match) {
      adopted.add(match.id);
      const lockedFields = Array.from(
        new Set([...(match.lockedFields ?? []), ...differingFields(item, match)]),
      );
      plan.update.push({
        id: match.id,
        changes: { goodreadsId: item.goodreadsId, lockedFields },
      });
      continue;
    }

    const create: Partial<Book> = {
      goodreadsId: item.goodreadsId,
      title: item.title,
      author: item.author,
      coverUrl: item.coverUrl,
      status: item.status,
      rating: item.rating,
      thoughts: item.thoughts,
      lockedFields: [],
    };
    if (item.totalPages !== null) create.totalPages = item.totalPages;
    if (item.dateAdded !== null) create.startedAt = item.dateAdded;
    if (item.readAt !== null) create.finishedAt = item.readAt;
    plan.create.push(create);
  }

  const feedIds = new Set(feed.map((i) => i.goodreadsId));
  plan.remove = goodreadsBooks
    .filter((b) => !feedIds.has(b.goodreadsId as string))
    .map((b) => b.id);

  return plan;
}
