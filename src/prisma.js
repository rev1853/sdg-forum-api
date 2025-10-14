const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const handleShutdown = async (event) => {
  await prisma.$disconnect();
  if (event === 'SIGINT' || event === 'SIGTERM') {
    process.exit(0);
  }
};

process.on('beforeExit', () => handleShutdown('beforeExit'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = prisma;
