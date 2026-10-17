import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodreadsSettings } from './goodreads-settings.entity';
import { GoodreadsController } from './goodreads.controller';
import { GoodreadsService, GOODREADS_FETCH } from './goodreads.service';

@Module({
  imports: [TypeOrmModule.forFeature([GoodreadsSettings])],
  controllers: [GoodreadsController],
  providers: [
    GoodreadsService,
    { provide: GOODREADS_FETCH, useValue: (url: string, init?: RequestInit) => fetch(url, init) },
  ],
  exports: [GoodreadsService],
})
export class GoodreadsModule {}
