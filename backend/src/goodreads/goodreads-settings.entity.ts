import { Entity, PrimaryColumn, Column } from 'typeorm';
import { SyncResult } from './sync-plan';

export const GOODREADS_SETTINGS_ID = 1;

export type SyncStatus =
  | ({ ok: true } & SyncResult)
  | { ok: false; error: string };

/** Single-row table holding the Goodreads sync configuration and last outcome. */
@Entity('goodreads_settings')
export class GoodreadsSettings {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  lastSyncResult: SyncStatus | null;

  /** Goodreads ids the owner deleted on purpose; sync won't re-create them. */
  @Column({ type: 'simple-json', default: '[]' })
  dismissedIds: string[];
}
