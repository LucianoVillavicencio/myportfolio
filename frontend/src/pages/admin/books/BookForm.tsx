import React, { useState } from 'react';
import type { Book, BookInput, ReadingStatus } from '../../../types';
import { api, findOpenLibraryCover } from '../../../lib/api';
import { useI18n } from '../../../i18n/LanguageContext';
import { useFormState } from '../../../hooks/useFormState';
import { FormField } from '../../../components/form/FormField';
import { BookCover } from '../../../components/books/BookCover';
import { useAdminMutation } from '../useAdminMutation';

interface BookFormProps {
  /** Book being edited; omit to create a new one. */
  book?: Book;
  onDone: () => void;
}

const STATUSES: ReadingStatus[] = ['READING', 'WANT_TO_READ', 'COMPLETED'];

type CoverNote = 'coverNeedsTitle' | 'coverNotFound' | 'coverUnreachable';

// Page counts stay strings while editing so clearing an input doesn't snap it to 0
type BookFormValues = Omit<BookInput, 'currentPage' | 'totalPages' | 'rating'> & {
  currentPage: string;
  totalPages: string;
  rating: string;
};

function toFormValues(book?: Book): BookFormValues {
  return {
    title: book?.title ?? '',
    author: book?.author ?? '',
    coverUrl: book?.coverUrl ?? '',
    status: book?.status ?? 'READING',
    currentPage: String(book?.currentPage ?? 0),
    totalPages: String(book?.totalPages ?? 300),
    rating: book?.rating ? String(book.rating) : '',
    thoughts: book?.thoughts ?? '',
  };
}

function toInput(values: BookFormValues): BookInput {
  return {
    ...values,
    currentPage: Number(values.currentPage) || 0,
    totalPages: Number(values.totalPages) || 1,
    rating: values.status === 'COMPLETED' && values.rating ? Number(values.rating) : null,
  };
}

export const BookForm: React.FC<BookFormProps> = ({ book, onDone }) => {
  const { t } = useI18n();
  const copy = t.admin.books;
  const { values, setField } = useFormState(toFormValues(book));
  const { run, isBusy, error } = useAdminMutation();
  const [coverNote, setCoverNote] = useState<CoverNote | null>(null);
  const [isFindingCover, setIsFindingCover] = useState(false);

  const handleStatusChange = (status: ReadingStatus) => {
    setField('status', status);
    if (status === 'COMPLETED') setField('currentPage', values.totalPages);
    if (status === 'WANT_TO_READ') setField('currentPage', '0');
  };

  const handleFindCover = async () => {
    if (!values.title.trim()) {
      setCoverNote('coverNeedsTitle');
      return;
    }
    setCoverNote(null);
    setIsFindingCover(true);
    try {
      const url = await findOpenLibraryCover(values.title, values.author);
      if (url) setField('coverUrl', url);
      else setCoverNote('coverNotFound');
    } catch {
      setCoverNote('coverUnreachable');
    } finally {
      setIsFindingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = toInput(values);
    const ok = await run((key) =>
      book ? api.updateBook(book.id, input, key) : api.createBook(input, key),
    );
    if (ok) onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <FormField label={copy.fields.title}>
          <input
            type="text"
            value={values.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder={copy.placeholders.title}
            required
          />
        </FormField>
        <FormField label={copy.fields.author}>
          <input
            type="text"
            value={values.author}
            onChange={(e) => setField('author', e.target.value)}
            placeholder={copy.placeholders.author}
            required
          />
        </FormField>
      </div>

      <div className="cover-input-row">
        <FormField label={copy.fields.cover} className="grow">
          <div className="cover-input-group">
            <input
              type="url"
              value={values.coverUrl}
              onChange={(e) => setField('coverUrl', e.target.value)}
              placeholder="https://covers.openlibrary.org/..."
            />
            <button
              type="button"
              className="btn-autofind-cover"
              onClick={handleFindCover}
              disabled={isFindingCover}
            >
              {isFindingCover ? copy.searching : copy.autoFind}
            </button>
          </div>
        </FormField>
        <BookCover
          book={{
            title: values.title || copy.untitled,
            author: values.author,
            coverUrl: values.coverUrl || null,
          }}
          accentColor="#f0b420"
          className="cover-mini-preview"
        />
      </div>
      {coverNote && <p className="admin-hint">{copy[coverNote]}</p>}

      <div className="form-row">
        <FormField label={copy.fields.status}>
          <select
            value={values.status}
            onChange={(e) => handleStatusChange(e.target.value as ReadingStatus)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t.status[status]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={copy.fields.currentPage}>
          <input
            type="number"
            min={0}
            max={Number(values.totalPages) || undefined}
            value={values.currentPage}
            onChange={(e) => setField('currentPage', e.target.value)}
            required
          />
        </FormField>
        <FormField label={copy.fields.totalPages}>
          <input
            type="number"
            min={1}
            value={values.totalPages}
            onChange={(e) => setField('totalPages', e.target.value)}
            required
          />
        </FormField>
        {values.status === 'COMPLETED' && (
          <FormField label={copy.fields.rating}>
            <select value={values.rating} onChange={(e) => setField('rating', e.target.value)}>
              <option value="">{copy.noRating}</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {'★'.repeat(n)}
                </option>
              ))}
            </select>
          </FormField>
        )}
      </div>

      <FormField label={copy.fields.notes}>
        <textarea
          rows={3}
          value={values.thoughts}
          onChange={(e) => setField('thoughts', e.target.value)}
          placeholder={copy.placeholders.notes}
        />
      </FormField>

      {error && <p className="form-error">{error}</p>}

      <div className="dialog-actions">
        {book && (
          <button type="button" className="btn-ghost" onClick={onDone}>
            {t.admin.cancel}
          </button>
        )}
        <button type="submit" className="btn-primary-mustard" disabled={isBusy}>
          {isBusy ? t.admin.saving : book ? t.admin.saveChanges : copy.submit}
        </button>
      </div>
    </form>
  );
};
