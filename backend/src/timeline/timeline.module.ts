import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineEntry } from './timeline-entry.entity';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimelineEntry])],
  controllers: [TimelineController],
  providers: [TimelineService],
})
export class TimelineModule {}
