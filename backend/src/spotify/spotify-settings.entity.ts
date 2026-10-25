import { Entity, PrimaryColumn, Column } from 'typeorm';
import { SpotifyPlaylist } from './spotify-client';

export const SPOTIFY_SETTINGS_ID = 1;

/** Single-row table holding the Spotify connection and the playlists to show. */
@Entity('spotify_settings')
export class SpotifySettings {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  /** Playlist ids the owner picked, in display order. */
  @Column({ type: 'simple-json', default: '[]' })
  selectedIds: string[];

  /** Snapshot of the picked playlists, so the public page never calls Spotify. */
  @Column({ type: 'simple-json', default: '[]' })
  playlists: SpotifyPlaylist[];

  @Column({ type: 'datetime', nullable: true })
  playlistsSyncedAt: Date | null;
}
