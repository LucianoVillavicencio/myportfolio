import {
  GOODREADS_SHELVES,
  GoodreadsFeedError,
  GoodreadsItem,
  GoodreadsShelf,
  parseShelfFeed,
} from './goodreads-feed';

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export const MAX_PAGES_PER_SHELF = 50;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/rss+xml, application/xml',
};

async function fetchPage(
  userId: string,
  shelf: GoodreadsShelf,
  page: number,
  fetchFn: FetchFn,
): Promise<GoodreadsItem[]> {
  const url = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}&page=${page}`;
  const where = `shelf "${shelf}" page ${page}`;
  let res: Response;
  try {
    res = await fetchFn(url, { headers: HEADERS });
  } catch (err) {
    throw new GoodreadsFeedError(
      `Network error fetching ${where}: ${(err as Error).message}`,
    );
  }
  if (!res.ok) {
    throw new GoodreadsFeedError(`Goodreads returned ${res.status} for ${where}`);
  }
  try {
    return parseShelfFeed(await res.text(), shelf);
  } catch (err) {
    throw new GoodreadsFeedError(
      `Could not read ${where}: ${(err as Error).message}`,
    );
  }
}

export async function fetchGoodreadsLibrary(
  userId: string,
  fetchFn: FetchFn = (url, init) => fetch(url, init),
): Promise<GoodreadsItem[]> {
  const books = new Map<string, GoodreadsItem>();

  for (const shelf of GOODREADS_SHELVES) {
    const seenOnShelf = new Set<string>();
    let page = 1;
    for (;;) {
      if (page > MAX_PAGES_PER_SHELF) {
        throw new GoodreadsFeedError(
          `Shelf "${shelf}" exceeded ${MAX_PAGES_PER_SHELF} pages`,
        );
      }
      const items = await fetchPage(userId, shelf, page, fetchFn);
      const fresh = items.filter((i) => !seenOnShelf.has(i.goodreadsId));
      if (fresh.length === 0) break;
      for (const item of fresh) {
        seenOnShelf.add(item.goodreadsId);
        // shelves are processed in precedence order: first match wins
        if (!books.has(item.goodreadsId)) books.set(item.goodreadsId, item);
      }
      page++;
    }
  }

  return [...books.values()];
}
