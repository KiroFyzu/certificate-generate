import prisma from './src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'admin@admin.com';
  const password = 'admin';
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      password_hash: hashedPassword,
    },
    create: {
      email,
      full_name: 'Super Admin',
      password_hash: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user ready:', admin.email);
  console.log('Password:', password);
}

main().catch(console.error)
