import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { SupportService } from './support.service';
import {
  CreateCaseStoryDto,
  UpdateCaseStoryDto,
  UpdateSupportCardDto,
} from './support.dto';
import { AdminKeyGuard } from '../common/admin-key.guard';

@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get()
  getPublic() {
    return this.service.getPublic();
  }

  // Declared before any parametrised route so ':id' can never swallow it.
  @Get('admin')
  @UseGuards(AdminKeyGuard)
  getAdmin() {
    return this.service.getAdmin();
  }

  @Patch()
  @UseGuards(AdminKeyGuard)
  update(@Body() dto: UpdateSupportCardDto) {
    return this.service.update(dto);
  }

  @Post('stories')
  @UseGuards(AdminKeyGuard)
  createStory(@Body() dto: CreateCaseStoryDto) {
    return this.service.createStory(dto);
  }

  @Patch('stories/:id')
  @UseGuards(AdminKeyGuard)
  updateStory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCaseStoryDto,
  ) {
    return this.service.updateStory(id, dto);
  }

  @Delete('stories/:id')
  @HttpCode(204)
  @UseGuards(AdminKeyGuard)
  removeStory(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeStory(id);
  }
}
