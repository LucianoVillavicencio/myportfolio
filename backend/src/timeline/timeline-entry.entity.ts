import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export const TIMELINE_KINDS = [
  'education',
  'work',
  'competition',
  'certification',
  'project',
] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];

@Entity('timeline_entries')
export class TimelineEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  kind: TimelineKind;

  /** Free label typed by the admin, e.g. "2020 – Presente". */
  @Column({ type: 'varchar' })
  period: string;

  /** Used for ordering. */
  @Column({ type: 'integer' })
  sortYear: number;

  /** Title per language; at least one is required. */
  @Column({ type: 'text', default: '' })
  titleEs: string;
  @Column({ type: 'text', default: '' })
  titleEn: string;
  @Column({ type: 'text', default: '' })
  descriptionEs: string;
  @Column({ type: 'text', default: '' })
  descriptionEn: string;

  @CreateDateColumn()
  createdAt: Date;
}
