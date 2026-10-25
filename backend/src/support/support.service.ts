import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportCard, SUPPORT_ID } from './support-card.entity';
import { CaseStory } from './case-story.entity';
import {
  CreateCaseStoryDto,
  UpdateCaseStoryDto,
  UpdateSupportCardDto,
} from './support.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportCard) private readonly cardRepo: Repository<SupportCard>,
    @InjectRepository(CaseStory) private readonly storyRepo: Repository<CaseStory>,
  ) {}

  /** The single card row, created empty and disabled when missing. */
  private async card(): Promise<SupportCard> {
    const existing = await this.cardRepo.findOne({ where: { id: SUPPORT_ID } });
    if (existing) return existing;
    return this.cardRepo.save(this.cardRepo.create({ id: SUPPORT_ID }));
  }

  private stories(): Promise<CaseStory[]> {
    return this.storyRepo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async getPublic(): Promise<{ card: SupportCard | null; stories: CaseStory[] }> {
    const card = await this.card();
    if (!card.enabled) return { card: null, stories: [] };
    return { card, stories: await this.stories() };
  }

  /** Always the full card, plus every story, so the admin can edit while disabled. */
  async getAdmin(): Promise<{ card: SupportCard; stories: CaseStory[] }> {
    return { card: await this.card(), stories: await this.stories() };
  }

  async update(dto: UpdateSupportCardDto): Promise<SupportCard> {
    const card = await this.card();
    Object.assign(card, dto);
    if (card.enabled) requireTitle(card);
    return this.cardRepo.save(card);
  }

  async createStory(dto: CreateCaseStoryDto): Promise<CaseStory> {
    const story = this.storyRepo.create(dto);
    requireTitle(story);
    return this.storyRepo.save(story);
  }

  async updateStory(id: string, dto: UpdateCaseStoryDto): Promise<CaseStory> {
    const story = await this.findStory(id);
    Object.assign(story, dto);
    requireTitle(story);
    return this.storyRepo.save(story);
  }

  async removeStory(id: string): Promise<void> {
    await this.findStory(id);
    await this.storyRepo.delete(id);
  }

  private async findStory(id: string): Promise<CaseStory> {
    const story = await this.storyRepo.findOne({ where: { id } });
    if (!story) throw new NotFoundException(`Case story with ID ${id} not found`);
    return story;
  }
}

function requireTitle(item: { titleEs: string; titleEn: string }): void {
  if (!item.titleEs && !item.titleEn) {
    throw new BadRequestException('A title is required in at least one language');
  }
}
