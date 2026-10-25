import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, PROFILE_ID } from './profile.entity';
import { UpdateProfileDto } from './profile.dto';

const DEFAULT_SPANISH = {
  rolesEs: 'Desarrollador de software y soporte IT\nHardware y redes',
  leadHighlightEs: 'Estudiante de Ingeniería en Sistemas.',
  leadTextEs:
    'Diseño y desarrollo aplicaciones web full-stack, y administro hardware e infraestructura de redes de punta a punta.',
  availabilityEs:
    'Disponible para soporte IT, desarrollo web y puestos junior de ingeniería',
};

const DEFAULT_ENGLISH = {
  rolesEn: 'Software Developer & IT Support\nHardware & Network',
  leadHighlightEn: 'Systems Engineering student.',
  leadTextEn:
    'I design and build full-stack web apps, and manage IT hardware and network infrastructure from end to end.',
  availabilityEn: 'Available for IT support, web dev & junior engineering roles',
};

/** Starting values for a fresh database; everything is editable from /admin. */
const DEFAULT_PROFILE: Omit<Profile, 'updatedAt'> = {
  id: PROFILE_ID,
  name: 'Luciano Villavicencio',
  location: 'Rosario, Argentina',
  ...DEFAULT_SPANISH,
  ...DEFAULT_ENGLISH,
  stack: 'React · NestJS · TypeScript · MySQL · LAN/WLAN · PC Hardware',
  email: 'lucianorvillavicencio@gmail.com',
  githubUrl: 'https://github.com/LucianoVillavicencio',
  linkedinUrl: 'https://linkedin.com/in/lucianovillavicencio',
  instagramUrl: 'https://www.instagram.com/lucho.villavicencio/',
  readingGoal: null,
};

@Injectable()
export class ProfileService implements OnModuleInit {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  async onModuleInit() {
    const profile = await this.profileRepo.findOne({ where: { id: PROFILE_ID } });
    if (!profile) {
      await this.profileRepo.save(this.profileRepo.create(DEFAULT_PROFILE));
      return;
    }
    // Profiles created before Spanish support: add the Spanish defaults, but
    // only for English text that hasn't been edited since it was seeded.
    let changed = false;
    for (const enKey of Object.keys(DEFAULT_ENGLISH) as (keyof typeof DEFAULT_ENGLISH)[]) {
      const esKey = enKey.replace(/En$/, 'Es') as keyof typeof DEFAULT_SPANISH;
      if (!profile[esKey] && profile[enKey] === DEFAULT_ENGLISH[enKey]) {
        profile[esKey] = DEFAULT_SPANISH[esKey];
        changed = true;
      }
    }
    if (changed) await this.profileRepo.save(profile);
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
