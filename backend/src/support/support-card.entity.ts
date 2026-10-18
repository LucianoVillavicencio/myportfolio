import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

export const SUPPORT_ID = 1;

/** Single-row table for the IT support card; created empty on first read. */
@Entity('support_card')
export class SupportCard {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'text', default: '' })
  titleEs: string;
  @Column({ type: 'text', default: '' })
  titleEn: string;
  @Column({ type: 'text', default: '' })
  introEs: string;
  @Column({ type: 'text', default: '' })
  introEn: string;

  /** One offering per line. */
  @Column({ type: 'text', default: '' })
  offeringsEs: string;
  @Column({ type: 'text', default: '' })
  offeringsEn: string;

  /** Service area, e.g. "Rosario y Gran Rosario". */
  @Column({ type: 'text', default: '' })
  areaEs: string;
  @Column({ type: 'text', default: '' })
  areaEn: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
