import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { EmptyToNull, Trim } from '../common/transforms';

export class UpdateProfileDto {
  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Trim()
  @IsOptional()
  @IsString()
  location?: string;

  @Trim()
  @IsOptional()
  @IsString()
  roles?: string;

  @Trim()
  @IsOptional()
  @IsString()
  leadHighlight?: string;

  @Trim()
  @IsOptional()
  @IsString()
  leadText?: string;

  @Trim()
  @IsOptional()
  @IsString()
  availability?: string;

  @Trim()
  @IsOptional()
  @IsString()
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
