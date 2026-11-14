/**
 * Creates the initial ADMIN account (admins cannot self-register).
 * Run: npm run db:seed   (reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env)
 */
import dotenv from 'dotenv';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'ReViveX Admin';

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before seeding');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, isActive: true },
    create: { name, email, passwordHash, role: Role.ADMIN },
  });

  console.log(`[seed] Admin account ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error('[seed] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
