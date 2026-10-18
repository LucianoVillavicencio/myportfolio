import { IsBoolean, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';
import { TextField } from '../common/transforms';

/**
 * Plain classes rather than PartialType: its IsOptional would let null through
 * on NOT NULL columns. Text null becomes ''; `enabled` and `sortOrder` reject
 * null with 400 (only `undefined` skips validation).
 */
export class UpdateSupportCardDto {
  @ValidateIf((_, v) => v !== undefined)
  @IsBoolean()
  enabled?: boolean;

  @TextField() @IsOptional() @IsString() titleEs?: string;
  @TextField() @IsOptional() @IsString() titleEn?: string;
  @TextField() @IsOptional() @IsString() introEs?: string;
  @TextField() @IsOptional() @IsString() introEn?: string;
  @TextField() @IsOptional() @IsString() offeringsEs?: string;
  @TextField() @IsOptional() @IsString() offeringsEn?: string;
  @TextField() @IsOptional() @IsString() areaEs?: string;
  @TextField() @IsOptional() @IsString() areaEn?: string;
}

export class CreateCaseStoryDto {
  // At least one title is required (checked in the service)
  @TextField() @IsOptional() @IsString() titleEs?: string;
  @TextField() @IsOptional() @IsString() titleEn?: string;
  @TextField() @IsOptional() @IsString() bodyEs?: string;
  @TextField() @IsOptional() @IsString() bodyEn?: string;

  @ValidateIf((_, v) => v !== undefined)
  @IsInt()
  sortOrder?: number;
}

export class UpdateCaseStoryDto extends CreateCaseStoryDto {}
