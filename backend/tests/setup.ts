import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';

// Generate unique test database name
const testDatabaseName = `mechanics_test_${randomBytes(8).toString('hex')}`;
process.env.DATABASE_URL = `postgresql://test_user:test_password@localhost:5433/${testDatabaseName}`;

let prisma: PrismaClient;

beforeAll(async () => {
  // Create test database
  execSync(`createdb -h localhost -p 5433 -U test_user ${testDatabaseName}`, {
    env: { ...process.env, PGPASSWORD: 'test_password' }
  });

  // Initialize Prisma client
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  // Run migrations
  execSync('npx prisma migrate deploy', {
    env: process.env,
    cwd: process.cwd()
  });

  // Connect to database
  await prisma.$connect();
}, 30000);

afterAll(async () => {
  // Clean up
  await prisma.$disconnect();
  
  // Drop test database
  execSync(`dropdb -h localhost -p 5433 -U test_user ${testDatabaseName}`, {
    env: { ...process.env, PGPASSWORD: 'test_password' }
  });
}, 10000);

beforeEach(async () => {
  // Clean database before each test
  const deleteOperations = [
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.systemSetting.deleteMany(),
    prisma.workOrderPart.deleteMany(),
    prisma.financialTransaction.deleteMany(),
    prisma.schedule.deleteMany(),
    prisma.workOrder.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.client.deleteMany(),
    prisma.partsInventory.deleteMany(),
    prisma.servicesCatalog.deleteMany(),
    prisma.userShop.deleteMany(),
    prisma.shop.deleteMany(),
    prisma.user.deleteMany()
  ];

  await prisma.$transaction(deleteOperations);
});

// Export prisma instance for tests
export { prisma };