import React, { useRef, useState } from 'react';
import { ApiError, uploadMedia } from '../../lib/api';
import { useI18n } from '../../i18n/LanguageContext';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

interface ImageListFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max: number;
  adminKey: string;
  /** Lets the parent form disable saving while an upload is running. */
  onBusyChange?: (busy: boolean) => void;
}

/** Uploads images on pick and lets the admin reorder or remove them; the first is the cover. */
export const ImageListField: React.FC<ImageListFieldProps> = ({
  value,
  onChange,
  max,
  adminKey,
  onBusyChange,
}) => {
  const { t } = useI18n();
  const copy = t.admin.projects.images;
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // let the same file be picked again
    if (files.length === 0) return;
    setError(null);
    if (files.some((f) => !ACCEPTED.includes(f.type))) {
      setError(copy.badType);
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
    const urls = [...value];
    try {
      for (const file of files.slice(0, max - value.length)) {
        urls.push((await uploadMedia(file, adminKey)).url);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.admin.genericError);
    } finally {
      // Keep whatever uploaded before a failure
      if (urls.length !== value.length) onChange(urls);
      setUploading(false);
      onBusyChange?.(false);
    }
  };

  const move = (from: number, to: number) => {
    const next = [...value];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <fieldset className="bilingual-field image-list-field">
      <legend>{copy.legend}</legend>
      <p className="admin-hint">{copy.hint(max)}</p>

      {value.length > 0 && (
        <ul className="image-list">
          {value.map((url, i) => (
            <li key={url} className="image-list-item">
              <img src={url} alt={copy.alt(i + 1)} />
              {i === 0 && <span className="image-list-cover">{copy.cover}</span>}
              <div className="image-list-actions">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  aria-label={copy.moveLeft}
                  title={copy.moveLeft}
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={i === value.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={copy.moveRight}
                  title={copy.moveRight}
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  aria-label={copy.remove}
                  title={copy.remove}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={handleFiles}
      />
      <button
        type="button"
        className="btn-ghost"
        disabled={uploading || value.length >= max}
        onClick={() => input.current?.click()}
      >
        {uploading ? copy.uploading : copy.add}
      </button>
      {error && <p className="form-error">{error}</p>}
    </fieldset>
  );
};
