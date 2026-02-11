import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@sar-kict.kr";

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`Admin already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = await hash("admin1234!", 12);

  const admin = await prisma.user.create({
    data: {
      name: "관리자",
      email: adminEmail,
      password: hashedPassword,
      status: "APPROVED",
      role: "ADMIN",
    },
  });

  console.log(`Admin created: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
