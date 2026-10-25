import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

export const PROFILE_ID = 1;

/**
 * Single-row table holding the site owner's public info.
 *
 * Translatable fields come in Spanish (`*Es`) and English (`*En`) pairs. The
 * English ones keep the original column names so existing data is preserved.
 */
@Entity('profile')
export class Profile {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column()
  name: string;

  @Column({ default: '' })
  location: string;

  /** One role per line, shown under the name in the hero info card. */
  @Column({ type: 'text', default: '' })
  rolesEs: string;

  @Column({ name: 'roles', type: 'text', default: '' })
  rolesEn: string;

  /** Bold opening sentence of the hero lead paragraph. */
  @Column({ default: '' })
  leadHighlightEs: string;

  @Column({ name: 'leadHighlight', default: '' })
  leadHighlightEn: string;

  @Column({ type: 'text', default: '' })
  leadTextEs: string;

  @Column({ name: 'leadText', type: 'text', default: '' })
  leadTextEn: string;

  @Column({ default: '' })
  availabilityEs: string;

  @Column({ name: 'availability', default: '' })
  availabilityEn: string;

  @Column({ default: '' })
  stack: string;

  @Column({ default: '' })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  githubUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  linkedinUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  instagramUrl: string | null;

  @Column({ type: 'int', nullable: true })
  readingGoal: number | null;

  /** Shows the reading stats panel on the bookshelf page. */
  @Column({ type: 'boolean', default: true })
  showReadingStats: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
