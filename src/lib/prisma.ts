import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getPrismaClient(): PrismaClient {
  const { env } = getRequestContext();
  const adapter = new PrismaD1((env as unknown as { DB: D1Database }).DB);
  return new PrismaClient({ adapter });
}
