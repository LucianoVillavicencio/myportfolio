import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, PROFILE_ID } from './profile.entity';
import { UpdateProfileDto } from './profile.dto';

/** Starting values for a fresh database; everything is editable from /admin. */
const DEFAULT_PROFILE: Omit<Profile, 'updatedAt'> = {
  id: PROFILE_ID,
  name: 'Luciano Villavicencio',
  location: 'Rosario, Argentina',
  roles: 'Software Developer & IT Support\nHardware & Network',
  leadHighlight: 'Systems Engineering student.',
  leadText:
    'I design and build full-stack web apps, and manage IT hardware and network infrastructure from end to end.',
  availability: 'Available for IT support, web dev & junior engineering roles',
  stack: 'React · NestJS · TypeScript · MySQL · LAN/WLAN · PC Hardware',
  email: 'lucianorvillavicencio@gmail.com',
  githubUrl: 'https://github.com/LucianoVillavicencio',
  linkedinUrl: 'https://linkedin.com/in/lucianovillavicencio',
  instagramUrl: 'https://www.instagram.com/lucho.villavicencio/',
};

@Injectable()
export class ProfileService implements OnModuleInit {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  async onModuleInit() {
    const exists = await this.profileRepo.exists({ where: { id: PROFILE_ID } });
    if (!exists) {
      await this.profileRepo.save(this.profileRepo.create(DEFAULT_PROFILE));
    }
  }

  get(): Promise<Profile> {
    return this.profileRepo.findOneOrFail({ where: { id: PROFILE_ID } });
  }

  async update(dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.get();
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }
}
