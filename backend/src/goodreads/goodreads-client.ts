import {
  GOODREADS_SHELVES,
  GoodreadsFeedError,
  GoodreadsItem,
  GoodreadsShelf,
  parseShelfWidget,
} from './goodreads-feed';

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export const MAX_BOOKS_PER_SHELF = 100;
export const REQUEST_TIMEOUT_MS = 20_000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/javascript, text/html, */*',
};

async function fetchShelf(
  userId: string,
  shelf: GoodreadsShelf,
  fetchFn: FetchFn,
): Promise<GoodreadsItem[]> {
  // Goodreads caches custom_widget fragments by (userId, widget_id); keying both
  // the path and widget_id by shelf ensures each shelf gets its own response.
  const url = `https://www.goodreads.com/review/custom_widget/${userId}.${shelf}?shelf=${shelf}&num_books=${MAX_BOOKS_PER_SHELF}&widget_id=${shelf}`;
  const where = `shelf "${shelf}"`;
  let res: Response;
  try {
    res = await fetchFn(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new GoodreadsFeedError(
      `Network error fetching ${where}: ${(err as Error).message}`,
    );
  }
  if (!res.ok) {
    throw new GoodreadsFeedError(`Goodreads returned ${res.status} for ${where}`);
  }
  try {
    return parseShelfWidget(await res.text(), shelf);
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
    const items = await fetchShelf(userId, shelf, fetchFn);
    for (const item of items) {
      // shelves are processed in precedence order: first match wins
      if (!books.has(item.goodreadsId)) books.set(item.goodreadsId, item);
    }
  }

  return [...books.values()];
}
