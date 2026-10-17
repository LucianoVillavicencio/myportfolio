import { applyDecorators } from '@nestjs/common';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
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
}
