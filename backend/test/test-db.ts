import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../src/books/book.entity';
import { Project } from '../src/projects/project.entity';
import { Profile } from '../src/profile/profile.entity';
import { GoodreadsSettings } from '../src/goodreads/goodreads-settings.entity';

/** In-memory sql.js database for service tests. */
export function testDb(): DynamicModule {
  return TypeOrmModule.forRoot({
    type: 'sqljs',
    entities: [Book, Project, Profile, GoodreadsSettings],
    synchronize: true,
    autoSave: false,
  });
}
