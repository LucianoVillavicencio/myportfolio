import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export const READING_STATUSES = ['READING', 'COMPLETED', 'WANT_TO_READ'] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const SYNCED_FIELDS = [
  'title',
  'author',
  'coverUrl',
  'status',
  'rating',
  'thoughts',
  'totalPages',
] as const;
export type SyncedField = (typeof SYNCED_FIELDS)[number];

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ type: 'varchar', nullable: true })
  coverUrl: string | null;

  @Column({ type: 'varchar', default: 'READING' })
  status: ReadingStatus;

  @Column({ type: 'int', default: 0 })
  currentPage: number;

  @Column({ type: 'int', default: 300 })
  totalPages: number;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'text', nullable: true })
  thoughts: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  goodreadsId: string | null;

  @Column({ type: 'simple-json', default: '[]' })
  lockedFields: SyncedField[];

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
