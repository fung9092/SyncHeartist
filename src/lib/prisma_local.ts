import { PrismaClient } from '@prisma/client';

// Use standard PrismaClient for local SQLite testing
const prisma = new PrismaClient();
export function getPrismaClient() {
  return prisma;
}
