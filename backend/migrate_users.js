const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'registration',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
    try {
        console.log('🔌 Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('🔨 Creating users table...');

            // Create table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'admin',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Check if admin exists
            const res = await client.query("SELECT * FROM users WHERE username = 'admin'");
            if (res.rows.length === 0) {
                console.log('👤 Creating default admin user...');
                const hash = await bcrypt.hash('admin123', 10);
                await client.query(
                    "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
                    ['admin', hash, 'admin']
                );
                console.log('✅ Admin user created (password: admin123)');
            } else {
                console.log('ℹ️ Admin user already exists');
            }

            console.log('✅ Migration completed successfully');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
