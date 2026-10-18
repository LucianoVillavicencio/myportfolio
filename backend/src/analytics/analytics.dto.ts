import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { EventType } from './analytics-daily.entity';

/** 'cv' is recorded server-side by CvController only. */
export const PUBLIC_EVENT_TYPES = ['view', 'outbound', 'contact'] as const;

export class AnalyticsEventDto {
  @IsIn(PUBLIC_EVENT_TYPES)
  type: EventType;

  @Matches(/^[a-z0-9/_:.-]{1,120}$/i)
  key: string;
}

export class AnalyticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days: number = 30;
}
