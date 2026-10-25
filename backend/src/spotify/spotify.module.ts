import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readSpotifyConfig } from './spotify-client';
import { SpotifySettings } from './spotify-settings.entity';
import { SpotifyController } from './spotify.controller';
import { SPOTIFY_CONFIG, SPOTIFY_FETCH, SpotifyService } from './spotify.service';

@Module({
  imports: [TypeOrmModule.forFeature([SpotifySettings])],
  controllers: [SpotifyController],
  providers: [
    SpotifyService,
    { provide: SPOTIFY_FETCH, useValue: (url: string, init?: RequestInit) => fetch(url, init) },
    { provide: SPOTIFY_CONFIG, useFactory: () => readSpotifyConfig(process.env) },
  ],
})
export class SpotifyModule {}
