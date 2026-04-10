import { PrismaClient, user_role_enum } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Starting user seeding...');

  // Hash the password
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cwx-dev.com' },
    update: {
      password: hashedPassword,
      role: user_role_enum.admin,
    },
    create: {
      username: 'admin@cwx-dev.com',
      email: 'admin@cwx-dev.com',
      password: hashedPassword,
      role: user_role_enum.admin,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  console.log(`Created admin user: ${adminUser.id}`);
  console.log('User seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma client
    await prisma.$disconnect();
  });
