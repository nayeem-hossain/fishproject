import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const operatorPassword = process.env.BOOTSTRAP_OPERATOR_PASSWORD;

  if (!adminPassword || !operatorPassword) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD and BOOTSTRAP_OPERATOR_PASSWORD are required for seeding.");
  }

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN
    },
    create: {
      username: "admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN
    }
  });

  await prisma.user.upsert({
    where: { username: "operator" },
    update: {
      passwordHash: await bcrypt.hash(operatorPassword, 12),
      role: Role.OPERATOR
    },
    create: {
      username: "operator",
      passwordHash: await bcrypt.hash(operatorPassword, 12),
      role: Role.OPERATOR
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });