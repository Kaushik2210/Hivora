export const brand = {
  name: 'hivora',
  displayName: 'Hivora',
  tagline: 'Multi-AI Coordination Platform',
  description:
    'Hivora brings multiple AI agents and human developers together under a single coordination layer — with symbol-level locking, git-native workflows, and a real-time team board.',
  url: (typeof process !== 'undefined' ? process.env.APP_URL : undefined) ?? 'http://localhost:3000',
  email: {
    from: (typeof process !== 'undefined' ? process.env.EMAIL_FROM : undefined) ?? 'no-reply@hivora.local',
    replyTo: (typeof process !== 'undefined' ? process.env.EMAIL_REPLY_TO : undefined) ?? 'support@hivora.local',
  },
  appId: 'com.hivora.app',
} as const;

export type Brand = typeof brand;
