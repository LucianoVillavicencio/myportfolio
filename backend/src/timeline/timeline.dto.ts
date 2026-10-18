import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Trim } from '../common/transforms';
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
  @Trim()
  @IsOptional()
  @IsString()
  titleEs?: string;

  @Trim()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @Trim()
  @IsOptional()
  @IsString()
  descriptionEs?: string;

  @Trim()
  @IsOptional()
  @IsString()
  descriptionEn?: string;
}

export class UpdateTimelineEntryDto extends PartialType(CreateTimelineEntryDto) {}
