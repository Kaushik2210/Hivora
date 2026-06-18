import type { IEmailProvider } from './email.js';
import { ConsoleEmailProvider } from './resend.js';
import { ResendEmailProvider } from './resend.js';
import { config } from '../config/index.js';

let provider: IEmailProvider | null = null;

export function getEmailProvider(): IEmailProvider {
  if (provider) return provider;

  switch (config.email.provider) {
    case 'resend':
      if (!config.email.resendApiKey) {
        console.warn('[Email] provider=resend but RESEND_API_KEY missing, falling back to console');
        provider = new ConsoleEmailProvider();
      } else {
        provider = new ResendEmailProvider(config.email.resendApiKey);
      }
      break;
    case 'console':
    default:
      provider = new ConsoleEmailProvider();
      break;
  }

  return provider;
}
