import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

export const PROFILE_ID = 1;

/** Single-row table holding the site owner's public info. */
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
  roles: string;

  /** Bold opening sentence of the hero lead paragraph. */
  @Column({ default: '' })
  leadHighlight: string;

  @Column({ type: 'text', default: '' })
  leadText: string;

  @Column({ default: '' })
  availability: string;

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

  @UpdateDateColumn()
  updatedAt: Date;
}
