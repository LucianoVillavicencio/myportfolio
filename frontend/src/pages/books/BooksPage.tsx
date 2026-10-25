import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book, ReadingStatus } from '../../types';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useI18n } from '../../i18n/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { groupByStatus } from '../../lib/books';
import { ShapeFan, ShapeLines, ShapeStar, ShapeSwirl } from '../../components/illustrations';
import { BookLightbox } from '../../components/books/BookLightbox';
import { LanguageToggle } from '../../components/layout/LanguageToggle';
import { NightstandSpotlight } from './NightstandSpotlight';
import { ShelfSection } from './ShelfSection';
import { ReadingStats } from './ReadingStats';

type ShelfTab = 'ALL' | ReadingStatus;

const TABS: ShelfTab[] = ['ALL', 'READING', 'WANT_TO_READ', 'COMPLETED'];

export const BooksPage: React.FC = () => {
  const { books, profile } = usePortfolioData();
  const { isAdmin } = useAdminAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ShelfTab>('ALL');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const closeLightbox = useCallback(() => setSelectedBook(null), []);
  useDocumentTitle(t.books.docTitle);

  const { reading, toRead, completed } = groupByStatus(books);
  const spotlightBook = reading[0] ?? completed[0] ?? toRead[0] ?? null;
  const shows = (tab: ShelfTab) => activeTab === 'ALL' || activeTab === tab;
  const tabCounts: Record<ShelfTab, number> = {
    ALL: books.length,
    READING: reading.length,
    WANT_TO_READ: toRead.length,
    COMPLETED: completed.length,
  };
  const { shelves } = t.books;
  const [wordmark1, wordmark2] = t.books.wordmark;

  return (
    <div className="pf bf-page">
      <header className="bf-hero">
        <div className="bf-topbar">
          <Link to="/" className="pill pill--back anim d1">
            <span className="arr">←</span> {t.common.backHome}
          </Link>

          <div className="pills">
            <LanguageToggle className="anim d2" />
            {isAdmin && (
              <Link to="/admin?tab=books" className="pill pill--admin anim d2">
                {t.books.manage}
              </Link>
            )}
            <Link to="/#contact" className="pill pill--contact anim d2">
              {t.common.contact}
            </Link>
          </div>
        </div>

        <div className="pf-print bf-print anim d2">
          <div className="bf-print-canvas">
            <ShapeSwirl className="bf-decor-swirl" />
            <ShapeLines className="bf-decor-lines" />

            <div className="bf-spotlight">
              <div className="bf-spotlight-stats">
                <Stat value={reading.length} label={t.books.stats.reading} />
                <Stat value={toRead.length} label={t.books.stats.toRead} />
                <Stat value={completed.length} label={t.books.stats.read} />
              </div>

              {spotlightBook && (
                <NightstandSpotlight book={spotlightBook} onInspect={setSelectedBook} />
              )}
            </div>

            <div className="pf-hero-copy bf-hero-copy">
              <h1 className="pf-wordmark">
                <span className="pf-w1">
                  {wordmark1}
                  <ShapeFan />
                </span>
                <span className="pf-w2">
                  {wordmark2}
                  <ShapeStar className="pf-star" />
                </span>
              </h1>

              <div className="pf-tabs pf-tabs--hero" role="tablist">
                {TABS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === key}
                    className={`pf-tab ${activeTab === key ? 'is-on' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    {t.books.tabs[key](tabCounts[key])}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pf-print-margin">
            <span className="pf-print-cap">{t.books.printCap}</span>
          </div>
        </div>
      </header>

      <main className="pf-gallery-wrap bf-shelves-wrap">
        {profile?.showReadingStats !== false && <ReadingStats books={books} />}
        {shows('READING') && (
          <ShelfSection
            heading={shelves.reading.heading}
            caption={shelves.reading.caption(reading.length)}
            emptyMessage={shelves.reading.empty}
            books={reading}
            accentOffset={0}
            onInspect={setSelectedBook}
          />
        )}
        {shows('WANT_TO_READ') && (
          <ShelfSection
            heading={shelves.toRead.heading}
            accentClass="text-yellow"
            caption={shelves.toRead.caption(toRead.length)}
            emptyMessage={shelves.toRead.empty}
            books={toRead}
            accentOffset={1}
            onInspect={setSelectedBook}
          />
        )}
        {shows('COMPLETED') && (
          <ShelfSection
            heading={shelves.completed.heading}
            accentClass="text-coral"
            caption={shelves.completed.caption(completed.length)}
            emptyMessage={shelves.completed.empty}
            books={completed}
            accentOffset={2}
            onInspect={setSelectedBook}
          />
        )}
      </main>

      <footer className="pf-foot">
        <p className="pf-foot-line">{t.books.footLine}</p>
        <Link className="btn btn--y" to="/">
          {t.books.backToPortfolio} <span className="arr">→</span>
        </Link>
      </footer>

      {selectedBook && <BookLightbox book={selectedBook} onClose={closeLightbox} />}
    </div>
  );
};

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="bf-stat-box">
    <span className="bf-stat-num">{value}</span>
    <span className="bf-stat-label">{label}</span>
  </div>
);
