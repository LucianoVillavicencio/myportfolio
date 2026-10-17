import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './profile.dto';
import { AdminKeyGuard } from '../common/admin-key.guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  get() {
    return this.profileService.get();
  }

  @Patch()
  @UseGuards(AdminKeyGuard)
  update(@Body() dto: UpdateProfileDto) {
    return this.profileService.update(dto);
  }
}
