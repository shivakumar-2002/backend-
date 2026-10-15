// scripts/createAdmin.js
require('dotenv').config(); // Load DB credentials from .env
const bcrypt = require('bcrypt');
const mongoose = require('mongoose'); // Or your ORM (Sequelize, Prisma, etc.)
const User = require('../models/User'); // Path to your User model

async function createSuperUser() {
    try {
        // 1. Connect to DB (adjust URI if using SQL/Postgres)
        await mongoose.connect(process.env.DATABASE_URL || process.env.MONGO_URI);

        const email = 'admin@example.com';
        const plainPassword = 'SuperSecretPassword123';

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists!');
            process.exit(0);
        }

        // 3. Hash the password (skip if your model uses a pre-save hook for bcrypt)
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const adminpass = process.env.Admin

        // 4. Create admin user
        const admin = await User.create({
            name: 'Super Admin',
            email,
            password: adminpass,
            role: 'admin',      // Or isAdmin: true, depending on your schema
            isActive: true,
        });

        console.log('Superuser created successfully:', admin.email);
    } catch (err) {
        console.error('Error creating superuser:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createSuperUser();