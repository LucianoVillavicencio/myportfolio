import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto } from './book.dto';
import { ReadingStatus } from './book.entity';
import { AdminKeyGuard } from '../common/admin-key.guard';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(@Query('status') status?: ReadingStatus) {
    return this.booksService.findAll(status);
  }

  @Post()
  @UseGuards(AdminKeyGuard)
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminKeyGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AdminKeyGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.booksService.remove(id);
  }
}
