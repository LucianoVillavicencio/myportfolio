import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactDto } from './contact.dto';
import { ContactMailer } from './contact-mailer';

@Controller('contact')
export class ContactController {
  constructor(private readonly mailer: ContactMailer) {}

  @Post()
  @HttpCode(204)
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  async send(@Body() dto: ContactDto): Promise<void> {
    if (dto.website) return; // honeypot: pretend success, send nothing
    await this.mailer.send({ name: dto.name, email: dto.email, message: dto.message });
  }
}
