import { fetchGoodreadsLibrary, FetchFn } from './goodreads-client';
import { GoodreadsFeedError } from './goodreads-feed';

function widget(ids: string[]): string {
  const items = ids
    .map(
      (id) =>
        `<div class="gr_custom_each_container_">` +
        `<div class="gr_custom_book_container_"><a title="Book ${id}" href="https://www.goodreads.com/review/show/${id}"><img src="https://i.gr-assets.com/books/1l/${id}._SY75_.jpg" /></a></div>` +
        `<div class="gr_custom_title_"><a href="https://www.goodreads.com/review/show/${id}">Book ${id}</a></div>` +
        `<div class="gr_custom_author_">by <a href="/a">Author</a></div>` +
        `</div>`,
    )
    .join('');
  const escaped = `<div class="gr_custom_container_">${items}</div>`
    .replace(/"/g, '\\"')
    .replace(/\//g, '\\/');
  return `var widget_code = '${escaped}'`;
}

type Shelves = Record<string, string[] | number>;

/** shelves keyed by shelf name -> ids (200) or a status code; missing = empty shelf */
function makeFake(shelves: Shelves) {
  const requestedUrls: string[] = [];
  const fake: FetchFn = async (url) => {
    requestedUrls.push(url);
    const u = new URL(url);
    const shelf = u.searchParams.get('shelf') ?? '';
    const entry = shelves[shelf] ?? [];
    if (typeof entry === 'number') return new Response('err', { status: entry });
    return new Response(widget(entry), { status: 200 });
  };
  return { fake, requestedUrls };
}

describe('fetchGoodreadsLibrary', () => {
  it('fetches each shelf via custom_widget and tags status by shelf', async () => {
    const { fake, requestedUrls } = makeFake({
      read: ['1', '2', '3'],
      'currently-reading': ['4'],
    });
    const items = await fetchGoodreadsLibrary('42', fake);
    expect(items.map((i) => [i.goodreadsId, i.status]).sort()).toEqual([
      ['1', 'COMPLETED'],
      ['2', 'COMPLETED'],
      ['3', 'COMPLETED'],
      ['4', 'READING'],
    ]);
    expect(requestedUrls).toContain(
      'https://www.goodreads.com/review/custom_widget/42.read?shelf=read&num_books=100&widget_id=read',
    );
  });

  it('prefers currently-reading over read over to-read for the same book', async () => {
    const { fake } = makeFake({
      'currently-reading': ['7'],
      read: ['7'],
      'to-read': ['7'],
    });
    const items = await fetchGoodreadsLibrary('42', fake);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('READING');
  });

  it('throws when a shelf returns an HTTP error', async () => {
    const { fake } = makeFake({ 'currently-reading': ['1'], read: 503 });
    await expect(fetchGoodreadsLibrary('42', fake)).rejects.toThrow(
      GoodreadsFeedError,
    );
  });

  it('throws when Goodreads returns an invalid or sign-in HTML page', async () => {
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

  it('passes an abort signal so a hung request cannot block forever', async () => {
    let signal: AbortSignal | null | undefined;
    const spy: FetchFn = async (_url, init) => {
      signal = init?.signal;
      return new Response(widget([]), { status: 200 });
    };
    await fetchGoodreadsLibrary('42', spy);
    expect(signal).toBeInstanceOf(AbortSignal);
  });
});
