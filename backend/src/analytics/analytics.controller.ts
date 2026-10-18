import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { AnalyticsEventDto, AnalyticsQueryDto } from './analytics.dto';
import { AnalyticsService, isAllowedEventKey, isBot } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly service: AnalyticsService) {}

  @Post('event')
  @HttpCode(204)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async event(
    @Body() dto: AnalyticsEventDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<void> {
    if (!isAllowedEventKey(dto.type, dto.key)) {
      throw new BadRequestException('Unknown analytics key');
    }
    if (isBot(userAgent)) return;
    try {
      await this.service.record(dto.type, dto.key);
    } catch (err) {
      this.logger.error(`record failed: ${(err as Error).message}`);
    }
  }

  @Get()
  @UseGuards(AdminKeyGuard)
  summary(@Query() query: AnalyticsQueryDto) {
    return this.service.summary(query.days);
  }
}
