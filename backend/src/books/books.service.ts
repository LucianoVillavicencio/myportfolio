import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, ReadingStatus, SYNCED_FIELDS } from './book.entity';
import { GoodreadsService } from '../goodreads/goodreads.service';
import { CreateBookDto, UpdateBookDto } from './book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
    private readonly goodreads: GoodreadsService,
  ) {}

  findAll(status?: ReadingStatus): Promise<Book[]> {
    return this.booksRepo.find({
      where: status ? { status } : undefined,
      order: { updatedAt: 'DESC' },
    });
  }

  create(dto: CreateBookDto): Promise<Book> {
    const book = this.booksRepo.create(dto);
    return this.booksRepo.save(normalizeProgress(book));
  }

  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.booksRepo.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    if (book.goodreadsId) {
      const locked = new Set(book.lockedFields);
      for (const field of SYNCED_FIELDS) {
        if (dto[field] !== undefined && dto[field] !== book[field]) locked.add(field);
      }
      book.lockedFields = [...locked];
    }
    Object.assign(book, dto);
    return this.booksRepo.save(normalizeProgress(book));
  }

  async remove(id: string): Promise<void> {
    const book = await this.booksRepo.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    if (book.goodreadsId) await this.goodreads.dismiss(book.goodreadsId);
    await this.booksRepo.delete(id);
  }

  async resetToGoodreads(id: string): Promise<Book> {
    const book = await this.booksRepo.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    if (!book.goodreadsId) {
      throw new BadRequestException('Only Goodreads books can be reset');
    }
    book.lockedFields = [];
    return this.booksRepo.save(book);
  }
}

/** Fills in defaults for a new book. */
function normalizeProgress(book: Book): Book {
  book.totalPages ??= 300;
  book.status ??= 'READING';
  return book;
}
