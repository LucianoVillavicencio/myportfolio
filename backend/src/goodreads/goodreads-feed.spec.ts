import * as fs from 'fs';
import * as path from 'path';
import {
  GoodreadsFeedError,
  cleanReview,
  extractGoodreadsUserId,
  parseShelfFeed,
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
});
