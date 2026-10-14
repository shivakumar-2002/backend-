import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database via Prisma');

    const server = app.listen(PORT, () => {
      console.log(`🚀 HARI HARA Jewellery Backend API running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('PostgreSQL connection closed. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only start standalone server if not running inside Vercel Serverless Function
if (!process.env.VERCEL) {
  startServer();
}

export default app;
