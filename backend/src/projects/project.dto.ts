import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUrl,
  ArrayMaxSize,
} from 'class-validator';
import { EmptyToNull, Trim } from '../common/transforms';

/** Trims, drops blanks and de-duplicates so cards never render repeated tags. */
const CleanTags = () =>
  Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    const tags = value
      .map((tag) => (typeof tag === 'string' ? tag.trim() : tag))
      .filter(Boolean);
    return [...new Set(tags)];
  });

export class CreateProjectDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  summary: string;

  @CleanTags()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  techStack: string[];

  @EmptyToNull()
  @IsOptional()
  @IsUrl()
  repoUrl?: string | null;

  @EmptyToNull()
  @IsOptional()
  @IsUrl()
  liveUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @Trim()
  @IsOptional()
  @IsString()
  completedDate?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
