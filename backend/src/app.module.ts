import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BooksModule } from './books/books.module';
import { ProjectsModule } from './projects/projects.module';
import { ProfileModule } from './profile/profile.module';
import { AuthController } from './auth/auth.controller';
import { Book } from './books/book.entity';
import { Project } from './projects/project.entity';
import { Profile } from './profile/profile.entity';
import { GoodreadsSettings } from './goodreads/goodreads-settings.entity';
import { GoodreadsModule } from './goodreads/goodreads.module';
import { resolveDbPath, resolveStaticDir } from './config';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: resolveDbPath(process.env),
      autoSave: true,
      entities: [Book, Project, Profile, GoodreadsSettings],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: resolveStaticDir(process.env),
      exclude: ['/api/{*path}'],
    }),
    ScheduleModule.forRoot(),
    BooksModule,
    ProjectsModule,
    ProfileModule,
    GoodreadsModule,
  ],
  controllers: [AuthController, HealthController],
})
export class AppModule {}
