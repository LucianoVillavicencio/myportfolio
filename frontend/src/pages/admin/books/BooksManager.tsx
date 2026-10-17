import React, { useState } from 'react';
import type { Book, ReadingStatus } from '../../../types';
import { ApiError, api } from '../../../lib/api';
import { accentFor } from '../../../lib/books';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { usePortfolioData } from '../../../context/PortfolioDataContext';
import { useI18n } from '../../../i18n/LanguageContext';
import { BookCover } from '../../../components/books/BookCover';
import { useAdminMutation } from '../useAdminMutation';
import { AdminRow, ManagerLayout } from '../ManagerLayout';
import { BookForm } from './BookForm';
import { BookGroup } from './BookGroup';
import { GoodreadsPanel } from './GoodreadsPanel';

const STATUS_ORDER: ReadingStatus[] = ['READING', 'WANT_TO_READ', 'COMPLETED'];

export const BooksManager: React.FC = () => {
  const { books, reload } = usePortfolioData();
  const { adminKey } = useAdminAuth();
  const { t } = useI18n();
  const copy = t.admin.books;
  const { run, isBusy, error } = useAdminMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  // Bumped after each save so the "new book" form remounts empty
  const [formKey, setFormKey] = useState(0);
  const [panelKey, setPanelKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const editingBook = books.find((b) => b.id === editingId);

  const closeForm = () => {
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const gr = copy.goodreads;

  const reset = async (book: Book) => {
    setNotice(null);
    const ok = await run((key) => api.resetBook(book.id, key));
    if (!ok || !adminKey) return;
    // The reset is saved; the follow-up sync only pulls the Goodreads values in.
    try {
      await api.syncGoodreads(adminKey);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNotice(gr.resetSyncPending);
      } else {
        setNotice(
          gr.resetSyncFailed(err instanceof Error ? err.message : t.admin.genericError),
        );
      }
    }
    await reload();
    setPanelKey((k) => k + 1);
  };

  const remove = async (book: Book) => {
    const message = book.goodreadsId
      ? gr.confirmDelete(book.title)
      : t.admin.confirmDelete(book.title);
    if (!window.confirm(message)) return;
    const ok = await run((key) => api.deleteBook(book.id, key));
    if (ok && book.id === editingId) closeForm();
  };

  const renderRow = (book: Book, i: number) => {
    const isEdited = book.goodreadsId !== null && book.lockedFields.length > 0;
    return (
      <AdminRow
        key={book.id}
        isSelected={book.id === editingId}
        thumb={<BookCover book={book} accentColor={accentFor(i)} className="admin-thumb" />}
        title={book.title}
        meta={
          <>
            <span className="source-badge">
              {book.goodreadsId ? gr.badgeGoodreads : gr.badgeManual}
            </span>
            {isEdited && <span className="source-badge source-badge--edited">{gr.edited}</span>}
            {`${book.totalPages}p`}
          </>
        }
        actions={
          <>
            {isEdited && (
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
    );
  };

  return (
    <ManagerLayout
      listTitle={copy.listTitle(books.length)}
      onNew={editingBook ? closeForm : undefined}
      newLabel={t.admin.newItem}
      list={
        <>
          <GoodreadsPanel refreshKey={panelKey} />
          {error && <p className="form-error">{error}</p>}
          {notice && <p className="admin-hint">{notice}</p>}
          {books.length === 0 ? (
            <p className="admin-hint">{copy.empty}</p>
          ) : (
            STATUS_ORDER.map((status) => (
              <BookGroup
                key={status}
                title={t.status[status]}
                books={books.filter((b) => b.status === status)}
                renderRow={renderRow}
              />
            ))
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
