import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { BooksModule } from './books/books.module';
import { ProjectsModule } from './projects/projects.module';
import { TimelineModule } from './timeline/timeline.module';
import { TimelineEntry } from './timeline/timeline-entry.entity';
import { ProfileModule } from './profile/profile.module';
import { AuthController } from './auth/auth.controller';
import { Book } from './books/book.entity';
import { Project } from './projects/project.entity';
import { Profile } from './profile/profile.entity';
import { GoodreadsSettings } from './goodreads/goodreads-settings.entity';
import { GoodreadsModule } from './goodreads/goodreads.module';
import { resolveDbPath, resolveStaticDir } from './config';
import { HealthController } from './health.controller';
import { BackupModule } from './backup/backup.module';
import { CvModule } from './cv/cv.module';
import { MediaModule } from './media/media.module';
import { atomicWriteFile } from './atomic-write';

const dbPath = resolveDbPath(process.env);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: dbPath,
      autoSave: true,
      autoSaveCallback: (data: Uint8Array) => atomicWriteFile(dbPath, data),
      entities: [Book, Project, Profile, GoodreadsSettings, TimelineEntry],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: resolveStaticDir(process.env),
      exclude: ['/api/{*path}'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    BooksModule,
    ProjectsModule,
    TimelineModule,
    ProfileModule,
    GoodreadsModule,
    BackupModule,
    CvModule,
    MediaModule,
  ],
  controllers: [AuthController, HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
