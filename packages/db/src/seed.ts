import { prisma } from './index.js';

async function seed() {
  console.log('Seeding Hivora database...');

  const existing = await prisma.user.findFirst({
    where: { email: 'demo@hivora.local' },
  });

  if (existing) {
    console.log('Seed already run. Skipping.');
    return;
  }

  console.log('Seed complete. No demo data inserted by default.');
  console.log('Tip: register a user via the API to get started.');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
