import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CvInfo, CvLang, CvStatus } from '../../types';
import { ApiError, api, cvUrl, uploadCv } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useI18n } from '../../i18n/LanguageContext';
import { AdminRow } from './ManagerLayout';
import { useAdminMutation } from './useAdminMutation';

const LANGS: CvLang[] = ['es', 'en'];
// Keep in sync with MAX_CV_BYTES in backend/src/cv/cv.controller.ts
const MAX_CV_BYTES = 10 * 1024 * 1024;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Replaces the Spanish and English CV PDFs linked from the home page. */
export const CvManager: React.FC = () => {
  const { adminKey } = useAdminAuth();
  const { t, locale } = useI18n();
  const copy = t.admin.cv;
  const { run, isBusy, error, clearError } = useAdminMutation();
  const [status, setStatus] = useState<CvStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState<CvLang | null>(null);
  // Bumped after each upload so the "View" link skips any cached copy
  const [version, setVersion] = useState(0);
  const inputs = useRef<Partial<Record<CvLang, HTMLInputElement | null>>>({});

  const refresh = useCallback(async () => {
    if (!adminKey) return;
    try {
      setStatus(await api.getCvStatus(adminKey));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t.admin.genericError);
    }
  }, [adminKey, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFile = async (lang: CvLang, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again
    if (!file) return;
    setNotice(null);
    clearError();
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setNotice({ ok: false, text: copy.notPdf });
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      setNotice({ ok: false, text: copy.tooBig });
      return;
    }
    setUploading(lang);
    const ok = await run((key) => uploadCv(lang, file, key));
    setUploading(null);
    if (ok) {
      setNotice({ ok: true, text: copy.saved(copy.lang[lang]) });
      setVersion((v) => v + 1);
      await refresh();
    }
  };

  const describe = (info: CvInfo | null) => {
    if (!info) return copy.missing;
    if (info.source === 'bundled') return copy.bundled;
    const date = new Date(info.updatedAt).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return copy.uploaded(date, formatSize(info.size));
  };

  return (
    <section className="admin-panel admin-panel--wide">
      <h2 className="admin-panel-title">{copy.title}</h2>
      <p className="admin-hint">{copy.hint}</p>

      <ul className="admin-list cv-list">
        {LANGS.map((lang) => {
          const info = status?.[lang] ?? null;
          return (
            <AdminRow
              key={lang}
              title={copy.lang[lang]}
              meta={status ? describe(info) : copy.loading}
              isSelected={false}
              actions={
                <>
                  {info && (
                    <a
                      className="cv-view-link"
                      href={`${cvUrl(lang)}?v=${version}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {copy.view} ↗
                    </a>
                  )}
                  <input
                    ref={(el) => {
                      inputs.current[lang] = el;
                    }}
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    onChange={(e) => handleFile(lang, e)}
                  />
                  <button
                    type="button"
                    className="is-on"
                    disabled={isBusy}
                    onClick={() => inputs.current[lang]?.click()}
                  >
                    {uploading === lang ? copy.uploading : copy.replace}
                  </button>
                </>
              }
            />
          );
        })}
      </ul>

      {loadError && <p className="form-error">{loadError}</p>}
      {error && <p className="form-error">{error}</p>}
      {notice && <p className={notice.ok ? 'form-success' : 'form-error'}>{notice.text}</p>}
    </section>
  );
};
