import { GoodreadsFeedError } from './goodreads-feed';
import { parseGoodreadsCsv } from './goodreads-csv';

const HEADER =
  'Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies';

describe('parseGoodreadsCsv', () => {
  it('parses books, dates, ratings, pages, shelves, and multiline HTML reviews', () => {
    const csv = [
      '\ufeff' + HEADER,
      '44767458,"Dune (Dune, #1)",Frank Herbert,"Herbert, Frank",,,,5,4.27,Ace,Paperback,604,1990,1965,2024/02/15,2024/01/05,sci-fi,,read,"Loved it.<br/>""Best"" sci-fi!",,,1,0',
      '12345,The Way of Kings,Brandon Sanderson,"Sanderson, Brandon",,,,0,4.65,Tor,Hardcover,1007,2010,2010,,2024/03/01,,,currently-reading,,,,0,0',
      '67890,Project Hail Mary,Andy Weir,"Weir, Andy",,,,0,4.51,Ballantine,Hardcover,,2021,2021,,2024/04/10,,,to-read,,,,0,0',
      '99999,Custom Shelf Book,Someone,"Someone",,,,0,4.0,,,,,,2024/04/10,,,dnf,,,,0,0',
    ].join('\r\n');

    const items = parseGoodreadsCsv(csv);
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({
      goodreadsId: '44767458',
      title: 'Dune (Dune, #1)',
      author: 'Frank Herbert',
      coverUrl: null,
      status: 'COMPLETED',
      rating: 5,
      thoughts: 'Loved it.\n"Best" sci-fi!',
      totalPages: 604,
      dateAdded: new Date('2024-01-05T00:00:00.000Z'),
      readAt: new Date('2024-02-15T00:00:00.000Z'),
    });
    expect(items[1]).toMatchObject({
      goodreadsId: '12345',
      status: 'READING',
      rating: null,
      totalPages: 1007,
      readAt: null,
    });
    expect(items[2]).toMatchObject({
      goodreadsId: '67890',
      status: 'WANT_TO_READ',
      totalPages: null,
      thoughts: null,
    });
  });

  it('rejects empty files and CSVs missing required columns', () => {
    expect(() => parseGoodreadsCsv('')).toThrow(GoodreadsFeedError);
    expect(() => parseGoodreadsCsv('Title,Author\nDune,Frank Herbert')).toThrow(
      GoodreadsFeedError,
    );
  });
});
