const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = "mock-user-id";
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      id: userId,
      email: "test@example.com",
      passwordHash: "mock-hash",
      displayName: "Tester"
    }
  });
  
  await prisma.creditWallet.upsert({
    where: { userId: user.id },
    update: { balance: 100 },
    create: {
      userId: user.id,
      balance: 100
    }
  });
  
  console.log("Seed complete: User created with 100 credits");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
