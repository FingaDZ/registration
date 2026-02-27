const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'registration',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Initialize database schema + run migrations automatically
async function initializeDatabase() {
    try {
        // 1. Main schema (idempotent - uses CREATE TABLE IF NOT EXISTS)
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('✓ Database schema initialized successfully');

        // 2. Run all migration files automatically (idempotent)
        const migrationsDir = path.join(__dirname, 'migrations');
        if (fs.existsSync(migrationsDir)) {
            const files = fs.readdirSync(migrationsDir)
                .filter(f => f.endsWith('.sql'))
                .sort(); // alphabetical order ensures consistent execution

            for (const file of files) {
                try {
                    const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                    await pool.query(migrationSql);
                    console.log(`✓ Migration applied: ${file}`);
                } catch (migErr) {
                    // Log but don't crash — migrations use IF NOT EXISTS / ON CONFLICT
                    console.warn(`⚠ Migration warning (${file}): ${migErr.message}`);
                }
            }
        }

    } catch (error) {
        console.error('✗ Error initializing database:', error.message);
        throw error;
    }
}

// Health check
async function checkDatabaseHealth() {
    try {
        const result = await pool.query('SELECT NOW()');
        return { healthy: true, timestamp: result.rows[0].now };
    } catch (error) {
        return { healthy: false, error: error.message };
    }
}

// Graceful shutdown
async function closeDatabaseConnection() {
    await pool.end();
    console.log('✓ Database connection pool closed');
}

module.exports = {
    pool,
    initializeDatabase,
    checkDatabaseHealth,
    closeDatabaseConnection
};
