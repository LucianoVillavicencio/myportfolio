import { ArrayMaxSize, ArrayUnique, IsArray, IsString, Matches } from 'class-validator';

export const MAX_SELECTED_PLAYLISTS = 12;

export class SetPlaylistsDto {
  @IsArray()
  @ArrayMaxSize(MAX_SELECTED_PLAYLISTS)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[A-Za-z0-9]{1,64}$/, { each: true })
  ids: string[];
}
