import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  findAll(): Promise<Project[]> {
    return this.projectsRepo.find({
      order: { featured: 'DESC', createdAt: 'DESC' },
    });
  }

  create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepo.create(dto);
    return this.projectsRepo.save(requireSummary(project));
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    Object.assign(project, dto);
    return this.projectsRepo.save(requireSummary(project));
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectsRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }
}

function requireSummary(project: Project): Project {
  if (!project.summaryEs && !project.summaryEn) {
    throw new BadRequestException('A summary is required in at least one language');
  }
  return project;
}
