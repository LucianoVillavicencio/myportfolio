import React, { useEffect, useState } from 'react';
import type { SpotifyArtist, SpotifyPlaylist } from '../../types';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/LanguageContext';
import { SectionHead } from '../../components/layout/SectionHead';

const TopArtistCard: React.FC<{ artist: SpotifyArtist }> = ({ artist }) => {
  const { t } = useI18n();
  const Wrapper = artist.url ? 'a' : 'div';

  return (
    <Wrapper
      className="spotify-artist"
      {...(artist.url
        ? { href: artist.url, target: '_blank', rel: 'noopener noreferrer', title: t.spotify.open }
        : {})}
    >
      {artist.imageUrl ? (
        <img className="spotify-artist-art" src={artist.imageUrl} alt="" />
      ) : (
        <span className="spotify-artist-art" aria-hidden="true" />
      )}
      <div className="spotify-artist-info">
        <span className="folio-badge">{t.spotify.topArtist}</span>
        <h3 className="folio-card-title">{artist.name}</h3>
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

/** Home section: my most listened artist of the month plus my picked playlists. */
export const SpotifySection: React.FC = () => {
  const { t } = useI18n();
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);

  useEffect(() => {
    api
      .getSpotifyTopArtist()
      .then((r) => setArtist(r.artist))
      .catch(() => setArtist(null));
    api
      .getSpotifyPlaylists()
      .then(setPlaylists)
      .catch(() => setPlaylists([]));
  }, []);

  // Nothing to show (not connected, no picks): leave the section out entirely
  if (!artist && playlists.length === 0) return null;

  return (
    <section id="music-section" className="content-stage">
      <div className="content-inner">
        <SectionHead
          eyebrow={t.spotify.eyebrow}
          title={t.spotify.title}
          accent={t.spotify.accent}
        />
        {artist && <TopArtistCard artist={artist} />}
        {playlists.length > 0 && (
          <>
            <p className="spotify-note">{t.spotify.playlistsNote}</p>
            <div className="cards-grid spotify-grid">
              {playlists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
