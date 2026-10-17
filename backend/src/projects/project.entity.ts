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

  @Column({ type: 'text' })
  summary: string;

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
