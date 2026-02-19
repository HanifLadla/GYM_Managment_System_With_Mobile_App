const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gym.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Role:', admin.role);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists!');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
