import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hubs = [
    { name: 'Programming', color: 'var(--accent-primary)', description: 'General programming concepts' },
    { name: 'JavaScript', color: '#f7df1e', description: 'Web development with JS' },
    { name: 'Mathematics', color: 'var(--accent-secondary)', description: 'Calculus, Algebra, and logic' },
    { name: 'Physics', color: '#10b981', description: 'Mechanics, quantum, and more' },
    { name: 'Electronics', color: '#f59e0b', description: 'Circuits and hardware' },
  ];

  console.log('Seeding hubs...');
  for (const hub of hubs) {
    await prisma.hub.upsert({
      where: { name: hub.name },
      update: {},
      create: hub,
    });
  }
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
