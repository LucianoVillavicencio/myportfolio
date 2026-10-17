import React, { useState } from 'react';
import type { Book } from '../../../types';
import { api } from '../../../lib/api';
import { accentFor } from '../../../lib/books';
import { usePortfolioData } from '../../../context/PortfolioDataContext';
import { useI18n } from '../../../i18n/LanguageContext';
import { BookCover } from '../../../components/books/BookCover';
import { useAdminMutation } from '../useAdminMutation';
import { AdminRow, ManagerLayout } from '../ManagerLayout';
import { BookForm } from './BookForm';
import { GoodreadsPanel } from './GoodreadsPanel';

export const BooksManager: React.FC = () => {
  const { books } = usePortfolioData();
  const { t } = useI18n();
  const copy = t.admin.books;
  const { run, isBusy, error } = useAdminMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  // Bumped after each save so the "new book" form remounts empty
  const [formKey, setFormKey] = useState(0);

  const editingBook = books.find((b) => b.id === editingId);

  const closeForm = () => {
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const gr = copy.goodreads;

  const reset = (book: Book) =>
    run(async (key) => {
      await api.resetBook(book.id, key);
      await api.syncGoodreads(key);
    });

  const remove = async (book: Book) => {
    const message = book.goodreadsId
      ? gr.confirmDelete(book.title)
      : t.admin.confirmDelete(book.title);
    if (!window.confirm(message)) return;
    const ok = await run((key) => api.deleteBook(book.id, key));
    if (ok && book.id === editingId) closeForm();
  };

  return (
    <ManagerLayout
      listTitle={copy.listTitle(books.length)}
      onNew={editingBook ? closeForm : undefined}
      newLabel={t.admin.newItem}
      list={
        <>
          <GoodreadsPanel />
          {error && <p className="form-error">{error}</p>}
          {books.length === 0 ? (
            <p className="admin-hint">{copy.empty}</p>
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
                  meta={
                    <>
                      <span className="source-badge">
                        {book.goodreadsId ? gr.badgeGoodreads : gr.badgeManual}
                      </span>
                      {book.goodreadsId && book.lockedFields.length > 0 && (
                        <span className="source-badge source-badge--edited">{gr.edited}</span>
                      )}
                      {`${t.status[book.status]} · ${book.totalPages}p`}
                    </>
                  }
                  actions={
                    <>
                      {book.goodreadsId && book.lockedFields.length > 0 && (
                        <button type="button" disabled={isBusy} onClick={() => reset(book)}>
                          {gr.reset}
                        </button>
                      )}
                      <button type="button" onClick={() => setEditingId(book.id)}>
                        {t.admin.edit}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        disabled={isBusy}
                        onClick={() => remove(book)}
                        aria-label={t.admin.deleteLabel(book.title)}
                      >
                        {t.admin.delete}
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </>
      }
      formTitle={editingBook ? copy.editTitle : copy.addTitle}
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
