import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportCard } from './support-card.entity';
import { CaseStory } from './case-story.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportCard, CaseStory])],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
