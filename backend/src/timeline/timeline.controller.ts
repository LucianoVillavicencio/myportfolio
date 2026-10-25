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
import { TimelineService } from './timeline.service';
import { CreateTimelineEntryDto, UpdateTimelineEntryDto } from './timeline.dto';
import { AdminKeyGuard } from '../common/admin-key.guard';

@Controller('timeline')
export class TimelineController {
  constructor(private readonly service: TimelineService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(AdminKeyGuard)
  create(@Body() dto: CreateTimelineEntryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminKeyGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTimelineEntryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AdminKeyGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
