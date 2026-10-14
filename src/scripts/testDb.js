import prisma from '../config/db.js';

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database successfully!');
    const adminCount = await prisma.adminUser.count();
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    console.log(`📊 DB Summary: ${adminCount} admin(s), ${categoryCount} categories, ${productCount} products.`);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
