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

  @CreateDateColumn()
  createdAt: Date;
}
