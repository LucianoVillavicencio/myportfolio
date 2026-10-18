import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';

@Module({
  imports: [AnalyticsModule],
  controllers: [CvController],
  providers: [CvService],
})
export class CvModule {}
