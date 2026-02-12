import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@kokoro.local' },
    update: { name: 'Demo User' },
    create: {
      email: 'demo@kokoro.local',
      name: 'Demo User',
      notificationSetting: {
        create: {
          proactiveCheckIns: false,
          emailNotifications: false,
          timezone: 'UTC',
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'seed.run',
      entityType: 'system',
      metadata: { message: 'Seeded initial demo user' },
    },
  });
}

main()
  .catch((error) => {
    console.error('Database seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
