import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book, ReadingStatus } from '../../types';
import { accentFor } from '../../lib/books';
import { useI18n } from '../../i18n/LanguageContext';
import { SectionHead } from '../../components/layout/SectionHead';
import { HomeBookCard } from '../../components/books/HomeBookCard';

type Filter = ReadingStatus | 'ALL';

const FILTERS: Filter[] = ['READING', 'COMPLETED', 'WANT_TO_READ', 'ALL'];

export const ReadingSection: React.FC<{ books: Book[] }> = ({ books }) => {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>('READING');
  const visible = filter === 'ALL' ? books : books.filter((b) => b.status === filter);

  return (
    <section id="reading-section" className="content-stage">
      <div className="content-inner">
        <SectionHead
          eyebrow={t.reading.eyebrow}
          title={t.reading.title}
          accent={t.reading.accent}
        >
          <div className="pf-tabs" role="tablist">
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={`pf-tab ${filter === key ? 'is-on' : ''}`}
                onClick={() => setFilter(key)}
              >
                {t.reading.filters[key]}
              </button>
            ))}
            <Link to="/books" className="pf-tab">
              {t.reading.fullShelf}
            </Link>
          </div>
        </SectionHead>

        {visible.length === 0 ? (
          <p className="bf-empty">{t.reading.empty[filter]}</p>
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
