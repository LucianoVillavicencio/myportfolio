import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './book.entity';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { GoodreadsModule } from '../goodreads/goodreads.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), GoodreadsModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
