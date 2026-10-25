import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimelineEntry } from './timeline-entry.entity';
import { CreateTimelineEntryDto, UpdateTimelineEntryDto } from './timeline.dto';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineEntry)
    private readonly repo: Repository<TimelineEntry>,
  ) {}

  findAll(): Promise<TimelineEntry[]> {
    return this.repo.find({ order: { sortYear: 'ASC', createdAt: 'ASC' } });
  }

  async create(dto: CreateTimelineEntryDto): Promise<TimelineEntry> {
    const entry = this.repo.create(dto);
    requireTitle(entry);
    return this.repo.save(entry);
  }

  async update(id: string, dto: UpdateTimelineEntryDto): Promise<TimelineEntry> {
    const entry = await this.find(id);
    Object.assign(entry, dto);
    requireTitle(entry);
    return this.repo.save(entry);
  }

  async remove(id: string): Promise<void> {
    await this.find(id);
    await this.repo.delete(id);
  }

  private async find(id: string): Promise<TimelineEntry> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException(`Timeline entry with ID ${id} not found`);
    return entry;
  }
}

function requireTitle(entry: TimelineEntry): void {
  if (!entry.titleEs && !entry.titleEn) {
    throw new BadRequestException('A title is required in at least one language');
  }
}
