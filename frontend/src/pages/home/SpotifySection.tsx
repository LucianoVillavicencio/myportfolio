import React, { useEffect, useState } from 'react';
import type { SpotifyNowPlaying, SpotifyPlaylist } from '../../types';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/LanguageContext';
import { SectionHead } from '../../components/layout/SectionHead';

/** Keep above the server's cache window so polling never outruns it. */
const POLL_MS = 20_000;

/** Polls the now-playing endpoint, pausing while the tab is hidden. */
function useNowPlaying(): SpotifyNowPlaying | null {
  const [state, setState] = useState<SpotifyNowPlaying | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      if (!document.hidden) {
        try {
          const next = await api.getSpotifyNowPlaying();
          if (!cancelled) setState(next);
        } catch {
          // keep showing the previous answer
        }
      }
      if (!cancelled) timer = window.setTimeout(tick, POLL_MS);
    };
    tick();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}

const NowPlayingCard: React.FC<{ data: SpotifyNowPlaying }> = ({ data }) => {
  const { t } = useI18n();
  const track = data.track;
  if (!track) return null;
  const label = data.isPlaying ? t.spotify.nowPlaying : t.spotify.lastPlayed;
  const Wrapper = track.url ? 'a' : 'div';

  return (
    <Wrapper
      className={`spotify-now ${data.isPlaying ? 'is-live' : ''}`}
      {...(track.url
        ? { href: track.url, target: '_blank', rel: 'noopener noreferrer', title: t.spotify.open }
        : {})}
    >
      {track.imageUrl ? (
        <img className="spotify-now-art" src={track.imageUrl} alt="" />
      ) : (
        <span className="spotify-now-art" aria-hidden="true" />
      )}
      <div className="spotify-now-info">
        <span className="folio-badge">
          {data.isPlaying && (
            <span className="spotify-eq" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
          {label}
        </span>
        <h3 className="folio-card-title">{track.title}</h3>
        <p className="folio-card-sub">{track.artists}</p>
      </div>
    </Wrapper>
  );
};

const PlaylistCard: React.FC<{ playlist: SpotifyPlaylist }> = ({ playlist }) => {
  const { t } = useI18n();
  const Wrapper = playlist.url ? 'a' : 'div';

  return (
    <Wrapper
      className="folio-card spotify-playlist"
      {...(playlist.url
        ? {
            href: playlist.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            'aria-label': `${playlist.name} — ${t.spotify.open}`,
          }
        : {})}
    >
      {playlist.imageUrl ? (
        <img className="spotify-cover" src={playlist.imageUrl} alt="" loading="lazy" />
      ) : (
        <span className="spotify-cover" aria-hidden="true" />
      )}
      <h3 className="folio-card-title">{playlist.name}</h3>
      {playlist.trackCount !== null && (
        <p className="folio-card-sub">{t.spotify.tracks(playlist.trackCount)}</p>
      )}
    </Wrapper>
  );
};

/** Home section: what I'm listening to (or last played) plus my picked playlists. */
export const SpotifySection: React.FC = () => {
  const { t } = useI18n();
  const nowPlaying = useNowPlaying();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);

  useEffect(() => {
    api
      .getSpotifyPlaylists()
      .then(setPlaylists)
      .catch(() => setPlaylists([]));
  }, []);

  const hasTrack = !!nowPlaying?.track;
  // Nothing to show (not connected, no picks): leave the section out entirely
  if (!hasTrack && playlists.length === 0) return null;

  return (
    <section id="music-section" className="content-stage">
      <div className="content-inner">
        <SectionHead
          eyebrow={t.spotify.eyebrow}
          title={t.spotify.title}
          accent={t.spotify.accent}
        />
        {nowPlaying && <NowPlayingCard data={nowPlaying} />}
        {playlists.length > 0 && (
          <div className="cards-grid spotify-grid">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
