import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { Trim } from '../common/transforms';

/** Trims text; null becomes '' so NOT NULL columns never receive null. */
const TextField = () =>
  Transform(({ value }) =>
    value === null ? '' : typeof value === 'string' ? value.trim() : value,
  );
import { TIMELINE_KINDS, TimelineKind } from './timeline-entry.entity';

export class CreateTimelineEntryDto {
  @IsIn(TIMELINE_KINDS)
  kind: TimelineKind;

  @Trim()
  @IsString()
  @IsNotEmpty()
  period: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  sortYear: number;

  // At least one title is required (checked in the service)
  @TextField()
  @IsOptional()
  @IsString()
  titleEs?: string;

  @TextField()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @TextField()
  @IsOptional()
  @IsString()
  descriptionEs?: string;

  @TextField()
  @IsOptional()
  @IsString()
  descriptionEn?: string;
}

export class UpdateTimelineEntryDto extends PartialType(CreateTimelineEntryDto) {}
