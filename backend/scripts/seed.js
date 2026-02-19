const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Seeding database...');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gym.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('Admin user created:', admin.email);

    await prisma.settings.create({
      data: {
        gymName: 'My Gym',
        monthlyFeeDefault: 50,
        lateFee: 10,
        workingHours: { open: '06:00', close: '22:00' }
      }
    });
    console.log('Settings created');

    const accounts = [
      { accountName: 'Cash', type: 'ASSET', description: 'Cash on hand' },
      { accountName: 'Bank Account', type: 'ASSET', description: 'Bank balance' },
      { accountName: 'Membership Income', type: 'INCOME', description: 'Member fees' },
      { accountName: 'Salary Expense', type: 'EXPENSE', description: 'Staff salaries' },
      { accountName: 'Equipment Expense', type: 'EXPENSE', description: 'Equipment purchases' },
      { accountName: 'Utility Expense', type: 'EXPENSE', description: 'Utilities' }
    ];

    for (const account of accounts) {
      await prisma.account.create({ data: account });
    }
    console.log('Default accounts created');

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
