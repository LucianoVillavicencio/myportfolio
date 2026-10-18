import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { EVENT_TYPES, EventType } from './analytics-daily.entity';

export class AnalyticsEventDto {
  @IsIn(EVENT_TYPES)
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
