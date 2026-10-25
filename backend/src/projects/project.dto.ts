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
  Matches,
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

  // At least one of the two summaries is required (checked in the service)
  @Trim()
  @IsOptional()
  @IsString()
  summaryEs?: string;

  @Trim()
  @IsOptional()
  @IsString()
  summaryEn?: string;

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

  /** Empty means auto-generate (create) or keep the current slug (update). */
  @EmptyToNull()
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, digits and single dashes',
  })
  slug?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  problemEs?: string;

  @Trim()
  @IsOptional()
  @IsString()
  problemEn?: string;

  @Trim()
  @IsOptional()
  @IsString()
  roleEs?: string;

  @Trim()
  @IsOptional()
  @IsString()
  roleEn?: string;

  @Trim()
  @IsOptional()
  @IsString()
  decisionsEs?: string;

  @Trim()
  @IsOptional()
  @IsString()
  decisionsEn?: string;

  @Trim()
  @IsOptional()
  @IsString()
  resultsEs?: string;

  @Trim()
  @IsOptional()
  @IsString()
  resultsEn?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @Matches(/^\/api\/media\//, { each: true })
  images?: string[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
