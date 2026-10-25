import { Body, Controller, Delete, Get, HttpCode, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { SetPlaylistsDto } from './spotify.dto';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotify: SpotifyService) {}

  // --- public ---------------------------------------------------------------

  @Get('now-playing')
  nowPlaying() {
    return this.spotify.getNowPlaying();
  }

  @Get('playlists')
  playlists() {
    return this.spotify.getPlaylists();
  }

  /** Spotify redirects the owner's browser here; it carries no admin key. */
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    let outcome = 'connected';
    if (error || !code || !state) {
      outcome = 'denied';
    } else {
      try {
        await this.spotify.handleCallback(code, state);
      } catch {
        outcome = 'error';
      }
    }
    res.redirect(302, `/admin?tab=spotify&spotify=${outcome}`);
  }

  // --- admin ----------------------------------------------------------------

  @Get()
  @UseGuards(AdminKeyGuard)
  status() {
    return this.spotify.getStatus();
  }

  @Get('auth-url')
  @UseGuards(AdminKeyGuard)
  authUrl() {
    return this.spotify.getAuthUrl();
  }

  @Get('available')
  @UseGuards(AdminKeyGuard)
  available() {
    return this.spotify.listAvailable();
  }

  @Put('playlists')
  @UseGuards(AdminKeyGuard)
  setPlaylists(@Body() dto: SetPlaylistsDto) {
    return this.spotify.setSelected(dto.ids);
  }

  @Post('sync')
  @HttpCode(200)
  @UseGuards(AdminKeyGuard)
  async sync() {
    await this.spotify.syncPlaylists();
    return this.spotify.getStatus();
  }

  @Delete()
  @UseGuards(AdminKeyGuard)
  disconnect() {
    return this.spotify.disconnect();
  }
}
