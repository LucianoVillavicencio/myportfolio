import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { MediaService } from '../media/media.service';
import { slugify } from './slug';

@Injectable()
export class ProjectsService implements OnModuleInit {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    private readonly media: MediaService,
  ) {}

  /** Existing rows predate slugs; give each one a working /projects/<slug>. */
  async onModuleInit(): Promise<void> {
    const missing = await this.projectsRepo.find({
      where: { slug: IsNull() },
      order: { createdAt: 'ASC' },
    });
    for (const project of missing) {
      project.slug = await this.uniqueSlug(slugify(project.title), project.id);
      await this.projectsRepo.save(project);
    }
  }

  findAll(): Promise<Project[]> {
    return this.projectsRepo.find({
      order: { featured: 'DESC', createdAt: 'DESC' },
    });
  }

  async findBySlug(slug: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { slug } });
    if (!project) throw new NotFoundException(`Project "${slug}" not found`);
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepo.create(dto);
    requireSummary(project);
    await this.assignSlug(project);
    return this.projectsRepo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    const previousImages = project.images ?? [];
    const { slug, ...rest } = dto;
    Object.assign(project, rest);
    requireSummary(project);
    if (slug) {
      project.slug = slug;
      await this.assignSlug(project);
    } else if (!project.slug) {
      await this.assignSlug(project);
    }
    const saved = await this.projectsRepo.save(project);
    const kept = new Set(saved.images ?? []);
    await this.media.deleteByUrls(previousImages.filter((url) => !kept.has(url)));
    return saved;
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    await this.projectsRepo.delete(id);
    await this.media.deleteByUrls(project.images ?? []);
  }

  /** Explicit slugs must be free; generated ones get -2, -3, ... appended. */
  private async assignSlug(project: Project): Promise<void> {
    if (project.slug) {
      const taken = await this.projectsRepo.findOne({
        where: { slug: project.slug, ...(project.id ? { id: Not(project.id) } : {}) },
      });
      if (taken) throw new ConflictException(`Slug "${project.slug}" is already in use`);
      return;
    }
    project.slug = await this.uniqueSlug(slugify(project.title), project.id);
  }

  private async uniqueSlug(base: string, ownId?: string): Promise<string> {
    let candidate = base;
    for (let n = 2; ; n++) {
      const clash = await this.projectsRepo.findOne({
        where: { slug: candidate, ...(ownId ? { id: Not(ownId) } : {}) },
      });
      if (!clash) return candidate;
      candidate = `${base}-${n}`;
    }
  }
}

function requireSummary(project: Project): Project {
  if (!project.summaryEs && !project.summaryEn) {
    throw new BadRequestException('A summary is required in at least one language');
  }
  return project;
}
