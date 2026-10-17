import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsUrl,
} from 'class-validator';
import { READING_STATUSES, ReadingStatus } from './book.entity';
import { EmptyToNull, Trim } from '../common/transforms';

export class CreateBookDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  author: string;

  @EmptyToNull()
  @IsOptional()
  @IsUrl()
  coverUrl?: string | null;

  @IsOptional()
  @IsIn(READING_STATUSES)
  status?: ReadingStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentPage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalPages?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number | null;

  @EmptyToNull()
  @IsOptional()
  @IsString()
  thoughts?: string | null;
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}
