import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient exists across the application
 * Prevents connection pool exhaustion and improves performance
 */

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

// In development, store the instance globally to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectPrisma();
});
