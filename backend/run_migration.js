require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Explicitly configure pool for the script, overriding defaults if needed
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'registration',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
    console.log(`Connecting to database at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}...`);
    try {
        const sqlPath = path.join(__dirname, 'database', 'migrations', 'add_dolibarr_id.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
