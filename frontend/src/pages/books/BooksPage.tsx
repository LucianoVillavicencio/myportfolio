import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book, ReadingStatus } from '../../types';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { groupByStatus, pluralize } from '../../lib/books';
import { ShapeFan, ShapeLines, ShapeStar, ShapeSwirl } from '../../components/illustrations';
import { BookLightbox } from '../../components/books/BookLightbox';
import { NightstandSpotlight } from './NightstandSpotlight';
import { ShelfSection } from './ShelfSection';

type ShelfTab = 'ALL' | ReadingStatus;

export const BooksPage: React.FC = () => {
  const { books } = usePortfolioData();
  const { isAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<ShelfTab>('ALL');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const closeLightbox = useCallback(() => setSelectedBook(null), []);
  useDocumentTitle('BookFolio — Reading Log & Library');

  const { reading, toRead, completed } = groupByStatus(books);
  const spotlightBook = reading[0] ?? completed[0] ?? toRead[0] ?? null;
  const shows = (tab: ShelfTab) => activeTab === 'ALL' || activeTab === tab;

  const tabs: [ShelfTab, string][] = [
    ['ALL', `All (${books.length})`],
    ['READING', `Currently Reading (${reading.length})`],
    ['WANT_TO_READ', `To-Read (${toRead.length})`],
    ['COMPLETED', `Read (${completed.length})`],
  ];

  return (
    <div className="pf bf-page">
      <header className="bf-hero">
        <div className="bf-topbar">
          <Link to="/" className="pill pill--back anim d1">
            <span className="arr">←</span> back home
          </Link>

          <div className="pills">
            {isAdmin && (
              <Link to="/admin?tab=books" className="pill pill--admin anim d2">
                manage books
              </Link>
            )}
            <Link to="/#contact" className="pill pill--contact anim d2">
              contact
            </Link>
          </div>
        </div>

        <div className="pf-print bf-print anim d2">
          <div className="bf-print-canvas">
            <ShapeSwirl className="bf-decor-swirl" />
            <ShapeLines className="bf-decor-lines" />

            <div className="bf-spotlight">
              <div className="bf-spotlight-stats">
                <Stat value={reading.length} label="CURRENTLY READING" />
                <Stat value={toRead.length} label="TO-READ QUEUE" />
                <Stat value={completed.length} label="BOOKS READ" />
              </div>

              {spotlightBook && (
                <NightstandSpotlight book={spotlightBook} onInspect={setSelectedBook} />
              )}
            </div>

            <div className="pf-hero-copy bf-hero-copy">
              <h1 className="pf-wordmark">
                <span className="pf-w1">
                  BOOK
                  <ShapeFan />
                </span>
                <span className="pf-w2">
                  SHELF
                  <ShapeStar className="pf-star" />
                </span>
              </h1>

              <div className="pf-tabs pf-tabs--hero" role="tablist">
                {tabs.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === key}
                    className={`pf-tab ${activeTab === key ? 'is-on' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pf-print-margin">
            <span className="pf-print-cap">
              TECHNICAL &amp; LITERATURE LOG · CURRENTLY READING, TO-READ &amp;
              COMPLETED ARCHIVE
            </span>
          </div>
        </div>
      </header>

      <main className="pf-gallery-wrap bf-shelves-wrap">
        {shows('READING') && (
          <ShelfSection
            heading="CURRENTLY READING"
            caption={`${pluralize(reading.length, 'book')} open on my desk`}
            emptyMessage="No books marked as currently reading."
            books={reading}
            accentOffset={0}
            onInspect={setSelectedBook}
          />
        )}
        {shows('WANT_TO_READ') && (
          <ShelfSection
            heading={
              <>
                TO-READ <span className="text-yellow">QUEUE</span>
              </>
            }
            caption={`${pluralize(toRead.length, 'book')} up next in the stack`}
            emptyMessage="No books in the To-Read queue yet."
            books={toRead}
            accentOffset={1}
            onInspect={setSelectedBook}
          />
        )}
        {shows('COMPLETED') && (
          <ShelfSection
            heading={
              <>
                ALREADY <span className="text-coral">READ</span>
              </>
            }
            caption={`${pluralize(completed.length, 'book')} finished & annotated`}
            emptyMessage="No completed books logged yet."
            books={completed}
            accentOffset={2}
            onInspect={setSelectedBook}
          />
        )}
      </main>

      <footer className="pf-foot">
        <p className="pf-foot-line">That&apos;s the shelf so far.</p>
        <Link className="btn btn--y" to="/">
          Back to the portfolio <span className="arr">→</span>
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
