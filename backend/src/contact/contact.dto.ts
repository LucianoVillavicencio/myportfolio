import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Trim } from '../common/transforms';

export class ContactDto {
  @Trim()
  @IsString()
  @Length(1, 100)
  name: string;

  @Trim()
  @IsEmail()
  @MaxLength(200)
  email: string;

  @Trim()
  @IsString()
  @Length(10, 5000)
  message: string;

  /** Honeypot: real visitors never fill it. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}
