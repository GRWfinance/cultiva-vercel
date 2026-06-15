const { PrismaClient } = require('@prisma/client');
const { seedDatabase } = require('./seedLogic');

const prisma = new PrismaClient();

seedDatabase(prisma)
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
