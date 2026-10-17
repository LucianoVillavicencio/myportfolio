import React, { useState } from 'react';
import type { Book } from '../../../types';
import { api } from '../../../lib/api';
import { STATUS_LABELS, accentFor } from '../../../lib/books';
import { usePortfolioData } from '../../../context/PortfolioDataContext';
import { BookCover } from '../../../components/books/BookCover';
import { useAdminMutation } from '../useAdminMutation';
import { AdminRow, ManagerLayout } from '../ManagerLayout';
import { BookForm } from './BookForm';

const QUICK_PAGES = 10;

export const BooksManager: React.FC = () => {
  const { books } = usePortfolioData();
  const { run, isBusy, error } = useAdminMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  // Bumped after each save so the "new book" form remounts empty
  const [formKey, setFormKey] = useState(0);

  const editingBook = books.find((b) => b.id === editingId);

  const closeForm = () => {
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const addPages = (book: Book) =>
    run((key) =>
      api.updateBook(
        book.id,
        { currentPage: Math.min(book.totalPages, book.currentPage + QUICK_PAGES) },
        key,
      ),
    );

  const remove = async (book: Book) => {
    if (!window.confirm(`Delete "${book.title}"? This can't be undone.`)) return;
    const ok = await run((key) => api.deleteBook(book.id, key));
    if (ok && book.id === editingId) closeForm();
  };

  return (
    <ManagerLayout
      listTitle={`BOOKS (${books.length})`}
      onNew={editingBook ? closeForm : undefined}
      list={
        <>
          {error && <p className="form-error">{error}</p>}
          {books.length === 0 ? (
            <p className="admin-hint">No books yet — add your first one.</p>
          ) : (
            <ul className="admin-list">
              {books.map((book, i) => (
                <AdminRow
                  key={book.id}
                  isSelected={book.id === editingId}
                  thumb={
                    <BookCover book={book} accentColor={accentFor(i)} className="admin-thumb" />
                  }
                  title={book.title}
                  meta={`${STATUS_LABELS[book.status]} · ${book.currentPage}/${book.totalPages}p`}
                  actions={
                    <>
                      {book.status === 'READING' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => addPages(book)}
                          title={`Add ${QUICK_PAGES} pages`}
                        >
                          +{QUICK_PAGES}p
                        </button>
                      )}
                      <button type="button" onClick={() => setEditingId(book.id)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        disabled={isBusy}
                        onClick={() => remove(book)}
                        aria-label={`Delete ${book.title}`}
                      >
                        Delete
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </>
      }
      formTitle={editingBook ? 'EDIT BOOK' : 'ADD A BOOK'}
      form={
        <BookForm
          key={editingBook?.id ?? `new-${formKey}`}
          book={editingBook}
          onDone={closeForm}
        />
      }
    />
  );
};
