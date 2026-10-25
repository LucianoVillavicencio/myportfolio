import { applyDecorators } from '@nestjs/common';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EmptyToNull, Trim } from '../common/transforms';

/** Optional, trimmed free-text field (blank allowed). */
const OptionalText = () => applyDecorators(Trim(), IsOptional(), IsString());

export class UpdateProfileDto {
  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @OptionalText()
  location?: string;

  @OptionalText()
  rolesEs?: string;

  @OptionalText()
  rolesEn?: string;

  @OptionalText()
  leadHighlightEs?: string;

  @OptionalText()
  leadHighlightEn?: string;

  @OptionalText()
  leadTextEs?: string;

  @OptionalText()
  leadTextEn?: string;

  @OptionalText()
  availabilityEs?: string;

  @OptionalText()
  availabilityEn?: string;

  @OptionalText()
  stack?: string;

  // Blank is allowed and hides the email from the contact footer
  @Trim()
  @IsOptional()
  @ValidateIf((o: UpdateProfileDto) => o.email !== '')
  @IsEmail()
  email?: string;

  @EmptyToNull()
  @IsOptional()
  @IsUrl()
  githubUrl?: string | null;

  @EmptyToNull()
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string | null;

  @EmptyToNull()
  @IsOptional()
  @IsUrl()
  instagramUrl?: string | null;

  // '' clears the goal; numeric strings become numbers (Type would turn '' into 0)
  @Transform(({ value }) =>
    typeof value === 'string' ? (value.trim() === '' ? null : Number(value)) : value,
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  readingGoal?: number | null;

  // Not IsOptional: that would let null through to a NOT NULL column
  @ValidateIf((_o, value) => value !== undefined)
  @IsBoolean()
  showReadingStats?: boolean;
}
