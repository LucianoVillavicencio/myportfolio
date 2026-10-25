import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { ContactController } from './contact.controller';
import { ContactMailer } from './contact-mailer';

@Module({
  imports: [ProfileModule],
  controllers: [ContactController],
  providers: [ContactMailer],
})
export class ContactModule {}
