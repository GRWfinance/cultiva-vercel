const { PrismaClient } = require('@prisma/client');

// Em ambiente serverless (Vercel), cada invocação pode criar uma nova instância.
// Usamos um singleton global para reaproveitar conexões entre invocações "quentes"
// e evitar esgotar o limite de conexões do Postgres.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__cultivaPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__cultivaPrisma = prisma;
}

module.exports = prisma;
