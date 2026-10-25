import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  /** Summary per language; at least one is required, the other falls back. */
  @Column({ type: 'text', default: '' })
  summaryEs: string;

  // Keeps the original column name so existing (English) summaries are preserved
  @Column({ name: 'summary', type: 'text', default: '' })
  summaryEn: string;

  @Column('simple-json')
  techStack: string[];

  @Column({ type: 'varchar', nullable: true })
  repoUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  liveUrl: string | null;

  /** Featured projects are listed first. */
  @Column({ default: true })
  featured: boolean;

  /** Free-form label shown on the card, e.g. "Oct 2026". */
  @Column({ type: 'varchar', default: '' })
  completedDate: string;

  /** URL identifier for the case-study page; unique, backfilled on startup. */
  @Column({ type: 'varchar', nullable: true, unique: true })
  slug: string | null;

  @Column({ type: 'text', default: '' })
  problemEs: string;
  @Column({ type: 'text', default: '' })
  problemEn: string;
  @Column({ type: 'text', default: '' })
  roleEs: string;
  @Column({ type: 'text', default: '' })
  roleEn: string;
  @Column({ type: 'text', default: '' })
  decisionsEs: string;
  @Column({ type: 'text', default: '' })
  decisionsEn: string;
  @Column({ type: 'text', default: '' })
  resultsEs: string;
  @Column({ type: 'text', default: '' })
  resultsEn: string;

  /** Screenshot media URLs; the first one is the cover. */
  @Column('simple-json', { default: '[]' })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;
}
