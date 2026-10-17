import React, { useCallback, useEffect, useState } from 'react';
import type { GoodreadsStatus } from '../../../types';
import { ApiError, api } from '../../../lib/api';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useI18n } from '../../../i18n/LanguageContext';
import { useAdminMutation } from '../useAdminMutation';

/** Connects the site to a public Goodreads profile and triggers manual syncs. */
export const GoodreadsPanel: React.FC<{ refreshKey?: number }> = ({ refreshKey = 0 }) => {
  const { adminKey } = useAdminAuth();
  const { t, locale } = useI18n();
  const copy = t.admin.books.goodreads;
  const { run, isBusy, error } = useAdminMutation();
  const [status, setStatus] = useState<GoodreadsStatus | null>(null);
  const [input, setInput] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!adminKey) return;
    try {
      const next = await api.getGoodreads(adminKey);
      setStatus(next);
      setLoadError(null);
      return next;
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t.admin.genericError);
    }
  }, [adminKey, t]);

  useEffect(() => {
    refresh().then((next) => next && setInput(next.userId ?? ''));
  }, [refresh, refreshKey]);

  const save = async () => {
    const ok = await run(async (key) => {
      const next = await api.setGoodreadsUser(input, key);
      setInput(next.userId ?? '');
    });
    if (ok) await refresh();
  };

  const sync = async () => {
    await run((key) => api.syncGoodreads(key));
    await refresh();
  };

  const last = status?.lastSyncResult;
  const syncing = isBusy || status?.isSyncing;

  return (
    <div className="goodreads-panel">
      <h3 className="admin-panel-title">{copy.title}</h3>
      <div className="goodreads-user-row">
        <label className="form-field grow">
          <span>{copy.userLabel}</span>
          <input
            value={input}
            placeholder={copy.userPlaceholder}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        <button type="button" className="btn-ghost" disabled={isBusy} onClick={save}>
          {copy.save}
        </button>
      </div>
      <p className="admin-hint">{copy.hint}</p>
      <div className="goodreads-actions">
        <button
          type="button"
          className="btn-primary-mustard"
          disabled={syncing || !status?.userId}
          onClick={sync}
        >
          {syncing ? copy.syncing : copy.sync}
        </button>
        <span className="goodreads-meta">
          {status?.lastSyncAt
            ? `${copy.lastSync}: ${new Date(status.lastSyncAt).toLocaleString(locale)}`
            : copy.neverSynced}
          {last?.ok && ` · ${copy.result(last.added, last.updated, last.removed)}`}
        </span>
      </div>
      {last && !last.ok && <p className="form-error">{last.error}</p>}
      {(error || loadError) && <p className="form-error">{error ?? loadError}</p>}
    </div>
  );
};
