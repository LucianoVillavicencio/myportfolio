import * as fs from 'fs';
import * as path from 'path';
import {
  GoodreadsFeedError,
  cleanReview,
  extractGoodreadsUserId,
  parseShelfFeed,
  parseShelfWidget,
} from './goodreads-feed';

const fixture = (name: string) =>
  fs.readFileSync(path.join(__dirname, '../../test/fixtures', name), 'utf8');

describe('goodreads-feed', () => {
  it('parses items and maps shelf to status', () => {
    const items = parseShelfFeed(fixture('goodreads-shelf.xml'), 'read');
    expect(items.map((i) => i.goodreadsId)).toEqual(['111', '222', '333']);
    expect(items[0]).toMatchObject({
      title: 'Dune (Dune, #1)',
      author: 'Frank Herbert',
      coverUrl: 'https://i.gr-assets.com/dune.jpg',
      status: 'COMPLETED',
      rating: 5,
      thoughts: 'Loved it.\nSpice!',
      totalPages: 604,
    });
    expect(items[0].dateAdded?.toISOString()).toBe('2022-01-01T18:00:00.000Z');
  });

  it('parses user_read_at into readAt, empty gives null', () => {
    const items = parseShelfFeed(fixture('goodreads-shelf.xml'), 'read');
    expect(items[0].readAt?.toISOString().slice(0, 10)).toBe('2022-02-02');
    expect(items[1].readAt).toBeNull();
  });

  it('maps missing values to null', () => {
    const [, phm] = parseShelfFeed(fixture('goodreads-shelf.xml'), 'to-read');
    expect(phm).toMatchObject({
      status: 'WANT_TO_READ',
      rating: null,
      thoughts: null,
      totalPages: null,
      coverUrl: null,
    });
  });

  it('returns [] for a channel with no items', () => {
    expect(
      parseShelfFeed('<rss><channel><title>x</title></channel></rss>', 'read'),
    ).toEqual([]);
  });

  it('rejects non-RSS', () => {
    expect(() => parseShelfFeed(fixture('not-rss.html'), 'read')).toThrow(
      GoodreadsFeedError,
    );
  });

  it('cleans review HTML', () => {
    expect(cleanReview('a<br />b &amp; <i>c</i>')).toBe('a\nb & c');
    expect(cleanReview('  ')).toBeNull();
    expect(cleanReview(undefined)).toBeNull();
  });

  it.each([
    ['12345', '12345'],
    ['https://www.goodreads.com/user/show/12345-lucho', '12345'],
    ['goodreads.com/user/show/987', '987'],
    ['not a user', null],
  ])('extracts user id from %s', (input, expected) => {
    expect(extractGoodreadsUserId(input)).toBe(expected);
  });

  describe('parseShelfWidget', () => {
    const sampleWidget = [
      `  var widget_code = '  <div class=\\"gr_custom_container_\\">\\n`,
      `      <div class=\\"gr_custom_each_container_\\">\\n`,
      `          <div class=\\"gr_custom_book_container_\\">\\n`,
      `            <a title=\\"Dune (Dune, #1)\\" rel=\\"nofollow\\" href=\\"https://www.goodreads.com/review/show/999?utm_source=custom_widget\\"><img alt=\\"Dune\\" border=\\"0\\" src=\\"https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1555447414l/44767458._SY75_.jpg\\" /><\\/a>\\n`,
      `          <\\/div>\\n`,
      `          <div class=\\"gr_custom_rating_\\">\\n`,
      `            <span class=\\" staticStars notranslate\\" title=\\"really liked it\\"><img src=\\"https://s.gr-assets.com/images/layout/gr_flat_red_star_active.png\\" /><img src=\\"https://s.gr-assets.com/images/layout/gr_flat_red_star_active.png\\" /><img src=\\"https://s.gr-assets.com/images/layout/gr_flat_red_star_active.png\\" /><img src=\\"https://s.gr-assets.com/images/layout/gr_flat_red_star_active.png\\" /><img src=\\"https://s.gr-assets.com/images/layout/gr_flat_red_star_inactive.png\\" /><\\/span>\\n`,
      `          <\\/div>\\n`,
      `          <div class=\\"gr_custom_title_\\">\\n`,
      `            <a rel=\\"nofollow\\" href=\\"https://www.goodreads.com/review/show/999\\">Dune<\\/a>\\n`,
      `          <\\/div>\\n`,
      `          <div class=\\"gr_custom_author_\\">\\n`,
      `            by <a rel=\\"nofollow\\" href=\\"https://www.goodreads.com/author/show/58\\">Frank Herbert<\\/a>\\n`,
      `          <\\/div>\\n`,
      `          <div class=\\"gr_custom_review_\\">\\n`,
      `            Loved it &amp; spice!\\n`,
      `          <\\/div>\\n`,
      `      <\\/div>\\n`,
      `      <div class=\\"gr_custom_each_container_\\">\\n`,
      `          <div class=\\"gr_custom_book_container_\\">\\n`,
      `            <a title=\\"No Cover Book\\" href=\\"https://www.goodreads.com/review/show/888\\"><img src=\\"https://s.gr-assets.com/assets/nophoto/book/50x75.png\\" /><\\/a>\\n`,
      `          <\\/div>\\n`,
      `          <div class=\\"gr_custom_title_\\"><a href=\\"https://www.goodreads.com/review/show/888\\">No Cover Book<\\/a><\\/div>\\n`,
      `          <div class=\\"gr_custom_author_\\">by <a href=\\"/a\\">Jane Doe<\\/a><\\/div>\\n`,
      `      <\\/div>\\n`,
      `  <\\/div>\\n'`,
    ].join('');

    it('parses books, upscales cover URL, counts active stars, and falls back to review id on nophoto', () => {
      const items = parseShelfWidget(sampleWidget, 'read');
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        goodreadsId: '44767458',
        title: 'Dune (Dune, #1)',
        author: 'Frank Herbert',
        coverUrl:
          'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1555447414l/44767458.jpg',
        status: 'COMPLETED',
        rating: 4,
        thoughts: 'Loved it & spice!',
        totalPages: null,
        dateAdded: null,
        readAt: null,
      });
      expect(items[1]).toMatchObject({
        goodreadsId: 'review:888',
        title: 'No Cover Book',
        author: 'Jane Doe',
        coverUrl: null,
        rating: null,
        thoughts: null,
      });
    });

    it('returns [] for a valid empty shelf widget', () => {
      const empty = `var widget_code = '<div class=\\"gr_custom_container_\\"><h2>Books<\\/h2><\\/div>'`;
      expect(parseShelfWidget(empty, 'currently-reading')).toEqual([]);
    });

    it('rejects invalid, private, or mismatched-shelf widget responses', () => {
      const invalid = `var widget_code = 'This Goodreads widget is not correct.'`;
      expect(() => parseShelfWidget(invalid, 'read')).toThrow(GoodreadsFeedError);
      expect(() => parseShelfWidget('<html><body>Sign in</body></html>', 'read')).toThrow(
        GoodreadsFeedError,
      );
      const wrongShelf = `var widget_code = '<div class=\\"gr_custom_container_\\"><a href=\\"https://www.goodreads.com/review/list/42?shelf=read&amp;utm_source=custom_widget\\">Books<\\/a><\\/div>'`;
      expect(() => parseShelfWidget(wrongShelf, 'currently-reading')).toThrow(
        GoodreadsFeedError,
      );
    });
  });
});
