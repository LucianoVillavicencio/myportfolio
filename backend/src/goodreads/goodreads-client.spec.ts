import { fetchGoodreadsLibrary, FetchFn } from './goodreads-client';
import { GoodreadsFeedError } from './goodreads-feed';

function rss(ids: string[]): string {
  const items = ids
    .map(
      (id) =>
        `<item><book_id>${id}</book_id><title>Book ${id}</title><author_name>Author</author_name></item>`,
    )
    .join('');
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>${items}</channel></rss>`;
}

type Pages = Record<string, string[] | number>;

/** pages keyed "shelf:page" -> ids (200) or a status code; missing = empty feed */
function makeFake(pages: Pages) {
  const requestedUrls: string[] = [];
  const fake: FetchFn = async (url) => {
    requestedUrls.push(url);
    const u = new URL(url);
    const key = `${u.searchParams.get('shelf')}:${u.searchParams.get('page')}`;
    const entry = pages[key] ?? [];
    if (typeof entry === 'number') return new Response('err', { status: entry });
    return new Response(rss(entry), { status: 200 });
  };
  return { fake, requestedUrls };
}

describe('fetchGoodreadsLibrary', () => {
  it('fetches pages until an empty page and tags status by shelf', async () => {
    const { fake, requestedUrls } = makeFake({
      'read:1': ['1', '2'],
      'read:2': ['3'],
      'currently-reading:1': ['4'],
    });
    const items = await fetchGoodreadsLibrary('42', fake);
    expect(items.map((i) => [i.goodreadsId, i.status]).sort()).toEqual([
      ['1', 'COMPLETED'],
      ['2', 'COMPLETED'],
      ['3', 'COMPLETED'],
      ['4', 'READING'],
    ]);
    expect(requestedUrls).toContain(
      'https://www.goodreads.com/review/list_rss/42?shelf=read&page=2',
    );
  });

  it('stops when a page repeats only known ids', async () => {
    const pages: Pages = {};
    for (let p = 1; p <= 60; p++) pages[`read:${p}`] = ['1', '2'];
    const { fake } = makeFake(pages);
    await expect(fetchGoodreadsLibrary('42', fake)).resolves.toHaveLength(2);
  });

  it('prefers currently-reading over read over to-read for the same book', async () => {
    const { fake } = makeFake({
      'currently-reading:1': ['7'],
      'read:1': ['7'],
      'to-read:1': ['7'],
    });
    const items = await fetchGoodreadsLibrary('42', fake);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('READING');
  });

  it('throws when a later page fails', async () => {
    const { fake } = makeFake({ 'read:1': ['1'], 'read:2': 503 });
    await expect(fetchGoodreadsLibrary('42', fake)).rejects.toThrow(
      GoodreadsFeedError,
    );
  });

  it('throws when a shelf returns HTML', async () => {
    const htmlFake: FetchFn = async () =>
      new Response('<html><body>Sign in</body></html>', { status: 200 });
    await expect(fetchGoodreadsLibrary('42', htmlFake)).rejects.toThrow(
      GoodreadsFeedError,
    );
  });

  it('throws when a network error occurs', async () => {
    await expect(
      fetchGoodreadsLibrary('42', () =>
        Promise.reject(new TypeError('fetch failed')),
      ),
    ).rejects.toThrow(GoodreadsFeedError);
  });
});
