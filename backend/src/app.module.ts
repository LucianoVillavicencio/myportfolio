import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { BooksModule } from './books/books.module';
import { ProjectsModule } from './projects/projects.module';
import { ProfileModule } from './profile/profile.module';
import { AuthController } from './auth/auth.controller';
import { Book } from './books/book.entity';
import { Project } from './projects/project.entity';
import { Profile } from './profile/profile.entity';
import { GoodreadsSettings } from './goodreads/goodreads-settings.entity';
import { GoodreadsModule } from './goodreads/goodreads.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      // Resolve relative to the backend folder so the DB doesn't depend on the CWD
      location:
        process.env.DB_PATH || join(__dirname, '..', 'portfolio.sqlite'),
      autoSave: true,
      entities: [Book, Project, Profile, GoodreadsSettings],
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    BooksModule,
    ProjectsModule,
    ProfileModule,
    GoodreadsModule,
  ],
  controllers: [AuthController],
})
export class AppModule {}
