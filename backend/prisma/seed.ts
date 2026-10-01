import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  "Mobile Phones",
  "Laptops",
  "Monitors",
  "Printers",
  "Headphones",
  "Keyboards",
  "Cameras",
  "Batteries",
  "Chargers",
  "Other",
];

async function main() {
  await prisma.$transaction(
    categories.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed categories:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
