import { IsOptional, IsString } from 'class-validator';
import { EmptyToNull } from '../common/transforms';

export class SetGoodreadsUserDto {
  @EmptyToNull()
  @IsOptional()
  @IsString()
  userId: string | null;
}
