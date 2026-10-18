import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('case_stories')
export class CaseStory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Title per language; at least one is required. */
  @Column({ type: 'text', default: '' })
  titleEs: string;
  @Column({ type: 'text', default: '' })
  titleEn: string;
  @Column({ type: 'text', default: '' })
  bodyEs: string;
  @Column({ type: 'text', default: '' })
  bodyEn: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
