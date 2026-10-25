import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

@Injectable()
export class ContactMailer {
  constructor(private readonly profile: ProfileService) {}

  async send(msg: ContactMessage): Promise<void> {
    // Read per call so the env can change without a restart (and in tests).
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new ServiceUnavailableException('Contact is not configured');
    const from = process.env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>';

    let res: Response;
    try {
      const to = process.env.CONTACT_TO || (await this.profile.get()).email;
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: msg.email,
          subject: `Portfolio: mensaje de ${msg.name.replace(/[\r\n\t\x00-\x1f\x7f]+/g, ' ')}`,
          text: `Nombre: ${msg.name}\nEmail: ${msg.email}\n\nMensaje:\n${msg.message}`,
        }),
      });
    } catch {
      throw new ServiceUnavailableException('Could not send the message');
    }
    if (!res.ok) throw new ServiceUnavailableException('Could not send the message');
  }
}
