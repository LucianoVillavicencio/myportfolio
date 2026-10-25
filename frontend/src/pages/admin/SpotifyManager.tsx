import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SpotifyPlaylist, SpotifyStatus } from '../../types';
import { ApiError, api } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useI18n } from '../../i18n/LanguageContext';
import { AdminRow } from './ManagerLayout';
import { useAdminMutation } from './useAdminMutation';

// Keep in sync with MAX_SELECTED_PLAYLISTS in backend/src/spotify/spotify.dto.ts
const MAX_PLAYLISTS = 12;

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i]);

/** Connects the owner's Spotify account and picks the playlists shown on the home page. */
export const SpotifyManager: React.FC = () => {
  const { adminKey } = useAdminAuth();
  const { t } = useI18n();
  const copy = t.admin.spotify;
  const { run, isBusy, error, clearError } = useAdminMutation();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [available, setAvailable] = useState<SpotifyPlaylist[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // The OAuth callback sends the owner back with ?spotify=connected|denied|error
  useEffect(() => {
    const outcome = params.get('spotify');
    if (!outcome) return;
    setNotice(
      outcome === 'connected'
        ? { ok: true, text: copy.connected }
        : { ok: false, text: outcome === 'denied' ? copy.denied : copy.failed },
    );
    const next = new URLSearchParams(params);
    next.delete('spotify');
    setParams(next, { replace: true });
  }, [params, setParams, copy]);

  const load = useCallback(async () => {
    if (!adminKey) return;
    try {
      const next = await api.getSpotifyStatus(adminKey);
      setStatus(next);
      setPicked(next.selectedIds);
      setLoadError(null);
      if (next.connected) setAvailable(await api.getSpotifyAvailable(adminKey));
      else setAvailable(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t.admin.genericError);
    }
  }, [adminKey, t]);

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(() => new Map((available ?? []).map((p) => [p.id, p])), [available]);
  // Picked ones first, in display order, then the rest as Spotify lists them
  const rows = useMemo(
    () => [
      ...picked.map((id) => byId.get(id)).filter((p): p is SpotifyPlaylist => !!p),
      ...(available ?? []).filter((p) => !picked.includes(p.id)),
    ],
    [available, byId, picked],
  );

  const connect = async () => {
    if (!adminKey) return;
    clearError();
    setRedirecting(true);
    try {
      const { url } = await api.getSpotifyAuthUrl(adminKey);
      window.location.assign(url);
    } catch (err) {
      setRedirecting(false);
      setLoadError(err instanceof ApiError ? err.message : t.admin.genericError);
    }
  };

  const toggle = (id: string) => {
    setNotice(null);
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const move = (id: string, delta: -1 | 1) => {
    setNotice(null);
    setPicked((cur) => {
      const from = cur.indexOf(id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= cur.length) return cur;
      const next = [...cur];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const save = async () => {
    setNotice(null);
    const ok = await run((key) => api.setSpotifyPlaylists(picked, key));
    if (ok) {
      setNotice({ ok: true, text: copy.saved });
      await load();
    }
  };

  const disconnect = async () => {
    if (!window.confirm(copy.confirmDisconnect)) return;
    setNotice(null);
    if (await run((key) => api.disconnectSpotify(key))) await load();
  };

  const dirty = status !== null && !sameIds(picked, status.selectedIds);

  return (
    <section className="admin-panel admin-panel--wide">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">{copy.title}</h2>
        {status?.connected && (
          <button type="button" className="btn-ghost" disabled={isBusy} onClick={disconnect}>
            {copy.disconnect}
          </button>
        )}
      </div>
      <p className="admin-hint">{copy.hint}</p>

      {status && !status.configured && <p className="form-error">{copy.notConfigured}</p>}

      {status?.configured && !status.connected && (
        <div className="spotify-connect">
          <p className="admin-hint">{copy.notConnected}</p>
          <button
            type="button"
            className="btn-primary-mustard"
            disabled={redirecting}
            onClick={connect}
          >
            {redirecting ? copy.connecting : copy.connect}
          </button>
        </div>
      )}

      {status?.connected && (
        <>
          {available === null && !loadError && <p className="admin-hint">{copy.loading}</p>}
          {available?.length === 0 && <p className="admin-hint">{copy.none}</p>}
          {rows.length > 0 && (
            <ul className="admin-list spotify-list">
              {rows.map((p) => {
                const position = picked.indexOf(p.id);
                const isPicked = position >= 0;
                const meta = [
                  p.trackCount !== null ? copy.tracks(p.trackCount) : null,
                  p.isPublic ? null : copy.private,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <AdminRow
                    key={p.id}
                    thumb={
                      p.imageUrl ? (
                        <img className="spotify-thumb" src={p.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <span className="spotify-thumb" aria-hidden="true" />
                      )
                    }
                    title={isPicked ? `${position + 1}. ${p.name}` : p.name}
                    meta={meta}
                    isSelected={isPicked}
                    actions={
                      <>
                        {isPicked && (
                          <>
                            <button
                              type="button"
                              aria-label={copy.up}
                              disabled={position === 0}
                              onClick={() => move(p.id, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              aria-label={copy.down}
                              disabled={position === picked.length - 1}
                              onClick={() => move(p.id, 1)}
                            >
                              ↓
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className={isPicked ? 'is-on' : ''}
                          disabled={!isPicked && picked.length >= MAX_PLAYLISTS}
                          onClick={() => toggle(p.id)}
                        >
                          {isPicked ? copy.hide : copy.show}
                        </button>
                      </>
                    }
                  />
                );
              })}
            </ul>
          )}
          <div className="goodreads-actions">
            <button
              type="button"
              className="btn-primary-mustard"
              disabled={isBusy || !dirty}
              onClick={save}
            >
              {isBusy ? copy.saving : copy.save}
            </button>
            <span className="goodreads-meta">{copy.selected(picked.length, MAX_PLAYLISTS)}</span>
          </div>
        </>
      )}

      {loadError && <p className="form-error">{loadError}</p>}
      {error && <p className="form-error">{error}</p>}
      {notice && <p className={notice.ok ? 'form-success' : 'form-error'}>{notice.text}</p>}
    </section>
  );
};
