import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, ReadingStatus, SYNCED_FIELDS } from './book.entity';
import { GoodreadsService } from '../goodreads/goodreads.service';
import { Profile, PROFILE_ID } from '../profile/profile.entity';
import { ReadingStats, computeReadingStats } from './reading-stats';
import { CreateBookDto, UpdateBookDto } from './book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly goodreads: GoodreadsService,
  ) {}

  findAll(status?: ReadingStatus): Promise<Book[]> {
    return this.booksRepo.find({
      where: status ? { status } : undefined,
      order: { updatedAt: 'DESC' },
    });
  }

  create(dto: CreateBookDto): Promise<Book> {
    const { finishedAt, ...rest } = dto;
    const book = this.booksRepo.create(rest);
    book.finishedAt = finishedAt ? new Date(finishedAt) : null;
    if (book.status === 'COMPLETED' && finishedAt === undefined) {
      book.finishedAt = new Date();
    }
    return this.booksRepo.save(normalizeProgress(book));
  }

  async stats(): Promise<ReadingStats> {
    const [books, profile] = await Promise.all([
      this.booksRepo.find(),
      this.profileRepo.findOne({ where: { id: PROFILE_ID } }),
    ]);
    return computeReadingStats(books, profile?.readingGoal ?? null, new Date());
  }

  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.booksRepo.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    const { finishedAt, ...rest } = dto;
    const patch: Partial<Book> = { ...rest };
    if (finishedAt !== undefined) {
      patch.finishedAt = finishedAt ? new Date(finishedAt) : null;
    } else if (
      dto.status === 'COMPLETED' &&
      book.status !== 'COMPLETED' &&
      !book.finishedAt
    ) {
      patch.finishedAt = new Date();
    }
    if (book.goodreadsId) {
      const locked = new Set(book.lockedFields);
      for (const field of SYNCED_FIELDS) {
        if (patch[field] !== undefined && !sameValue(patch[field], book[field])) {
          locked.add(field);
        }
      }
      book.lockedFields = [...locked];
    }
    Object.assign(book, patch);
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

function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Date || b instanceof Date) {
    const time = (v: unknown) => (v instanceof Date ? v.getTime() : null);
    return time(a) === time(b);
  }
  return a === b;
}

/** Fills in defaults for a new book. */
function normalizeProgress(book: Book): Book {
  book.totalPages ??= 300;
  book.status ??= 'READING';
  return book;
}
