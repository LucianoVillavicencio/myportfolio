import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, ReadingStatus } from './book.entity';
import { CreateBookDto, UpdateBookDto } from './book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
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
    Object.assign(book, dto);
    return this.booksRepo.save(normalizeProgress(book));
  }

  async remove(id: string): Promise<void> {
    const result = await this.booksRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
  }
}

/** Keeps page counts and status consistent with each other. */
function normalizeProgress(book: Book): Book {
  const total = (book.totalPages ??= 300);
  book.status ??= 'READING';
  book.currentPage = Math.min(Math.max(book.currentPage ?? 0, 0), total);
  if (book.status === 'COMPLETED') {
    book.currentPage = total;
  } else if (book.currentPage === total && book.status === 'READING') {
    book.status = 'COMPLETED';
  }
  return book;
}
