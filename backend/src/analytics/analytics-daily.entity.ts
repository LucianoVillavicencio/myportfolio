import { Column, Entity, PrimaryColumn } from 'typeorm';

export const EVENT_TYPES = ['view', 'cv', 'outbound', 'contact'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Daily aggregate counter. Deliberately holds nothing about the visitor. */
@Entity('analytics_daily')
export class AnalyticsDaily {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  day: string;

  @PrimaryColumn({ type: 'varchar' })
  type: EventType;

  @PrimaryColumn({ type: 'varchar' })
  key: string;

  @Column({ type: 'integer', default: 0 })
  count: number;
}
