import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Trim } from '../common/transforms';
import { TIMELINE_KINDS, TimelineKind } from './timeline-entry.entity';

/** Trims text; null becomes '' so NOT NULL columns never receive null. */
const TextField = () =>
  Transform(({ value }) =>
    value === null ? '' : typeof value === 'string' ? value.trim() : value,
  );

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

/**
 * Not a PartialType: its IsOptional would also let null through on the
 * NOT NULL columns. Here only `undefined` (field omitted) skips validation.
 */
export class UpdateTimelineEntryDto {
  @ValidateIf((_, v) => v !== undefined)
  @IsIn(TIMELINE_KINDS)
  kind?: TimelineKind;

  @Trim()
  @ValidateIf((_, v) => v !== undefined)
  @IsString()
  @IsNotEmpty()
  period?: string;

  @ValidateIf((_, v) => v !== undefined)
  @IsInt()
  @Min(1900)
  @Max(2100)
  sortYear?: number;

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
