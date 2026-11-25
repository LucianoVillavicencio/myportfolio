import {
  GoodreadsFeedError,
  GoodreadsItem,
  GoodreadsShelf,
  SHELF_STATUS,
  cleanReview,
} from './goodreads-feed';

/** RFC 4180 CSV parser supporting quoted fields, escaped quotes, and multiline values. */
export function parseCsvRows(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field === '') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell !== '')) rows.push(row);
  }

  return rows;
}

function parseGoodreadsDate(raw: string | undefined): Date | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  // Goodreads exports dates as YYYY/MM/DD (or YYYY-MM-DD)
  const match = value.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match) {
    const d = new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const REQUIRED_COLUMNS = ['Book Id', 'Title', 'Author', 'Exclusive Shelf'] as const;

export function parseGoodreadsCsv(csv: string): GoodreadsItem[] {
  const rows = parseCsvRows(csv);
  if (rows.length === 0) {
    throw new GoodreadsFeedError('CSV file is empty');
  }

  const header = rows[0].map((h) => h.trim());
  const index = new Map(header.map((name, i) => [name, i]));
  for (const col of REQUIRED_COLUMNS) {
    if (!index.has(col)) {
      throw new GoodreadsFeedError(
        `CSV is missing required Goodreads column "${col}"`,
      );
    }
  }

  const cell = (r: string[], name: string): string => {
    const idx = index.get(name);
    return idx === undefined ? '' : (r[idx] ?? '').trim();
  };

  const items: GoodreadsItem[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const goodreadsId = cell(r, 'Book Id');
    const title = cell(r, 'Title');
    const shelfRaw = cell(r, 'Exclusive Shelf').toLowerCase() as GoodreadsShelf;
    const status = SHELF_STATUS[shelfRaw];
    if (!goodreadsId || !title || !status || seen.has(goodreadsId)) continue;
    seen.add(goodreadsId);

    const rating = parseInt(cell(r, 'My Rating'), 10);
    const pages = parseInt(cell(r, 'Number of Pages'), 10);

    items.push({
      goodreadsId,
      title,
      author: cell(r, 'Author'),
      coverUrl: null,
      status,
      rating: rating > 0 && rating <= 5 ? rating : null,
      thoughts: cleanReview(cell(r, 'My Review')),
      totalPages: pages > 0 ? pages : null,
      dateAdded: parseGoodreadsDate(cell(r, 'Date Added')),
      readAt: parseGoodreadsDate(cell(r, 'Date Read')),
    });
  }

  return items;
}
