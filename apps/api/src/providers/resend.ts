import type { IEmailProvider, EmailMessage } from './email.js';
import { config } from '../config/index.js';

export class ConsoleEmailProvider implements IEmailProvider {
  async send(msg: EmailMessage): Promise<void> {
    console.log('\n========== EMAIL (console provider) ==========');
    console.log(`To: ${msg.to}`);
    console.log(`Subject: ${msg.subject}`);
    console.log(`Text: ${msg.text}`);
    console.log('===============================================\n');
  }
}

export class ResendEmailProvider implements IEmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(msg: EmailMessage): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.email.from,
        reply_to: config.email.replyTo,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend API error ${res.status}: ${body}`);
    }
  }
}
