import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book, ReadingStatus } from '../../types';
import { accentFor } from '../../lib/books';
import { SectionHead } from '../../components/layout/SectionHead';
import { HomeBookCard } from '../../components/books/HomeBookCard';

type Filter = ReadingStatus | 'ALL';

const FILTERS: [Filter, string][] = [
  ['READING', 'Reading Now'],
  ['COMPLETED', 'Completed'],
  ['WANT_TO_READ', 'Queue'],
  ['ALL', 'All'],
];

const EMPTY_MESSAGES: Record<Filter, string> = {
  READING: 'Nothing on the nightstand right now.',
  COMPLETED: 'No finished books logged yet.',
  WANT_TO_READ: 'The to-read queue is empty.',
  ALL: 'No books on the shelf yet.',
};

export const ReadingSection: React.FC<{ books: Book[] }> = ({ books }) => {
  const [filter, setFilter] = useState<Filter>('READING');
  const visible = filter === 'ALL' ? books : books.filter((b) => b.status === filter);

  return (
    <section id="reading-section" className="content-stage">
      <div className="content-inner">
        <SectionHead eyebrow="LIVE READING TRACKER" title="CURRENTLY" accent="READING">
          <div className="pf-tabs" role="tablist">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={`pf-tab ${filter === key ? 'is-on' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
            <Link to="/books" className="pf-tab">
              Full Bookshelf →
            </Link>
          </div>
        </SectionHead>

        {visible.length === 0 ? (
          <p className="bf-empty">{EMPTY_MESSAGES[filter]}</p>
        ) : (
          <div className="cards-grid">
            {visible.map((book, i) => (
              <HomeBookCard key={book.id} book={book} accentColor={accentFor(i)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
