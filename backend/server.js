require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, closeDatabaseConnection } = require('./database/init');
const apiRoutes = require('./routes/api');
const { ipFilter, deviceFilter, helmet, limiter } = require('./middleware/security');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (needed when behind Nginx/Docker - fixes rate-limit X-Forwarded-For error)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(process.env.NODE_ENV === 'production' ? limiter : (req, res, next) => next());
app.use(cors({
    origin: ['http://192.168.20.33', 'http://localhost'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Filters (IP & Device)
app.use(ipFilter);
app.use(deviceFilter);

// Login-specific rate limiter (brute-force protection)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Authentication Routes (Public, with login rate limit)
const authRoutes = require('./routes/auth');
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

// Protected API Routes
const { verifyToken } = require('./middleware/auth');
const { requireRole } = require('./middleware/roles');
const userRoutes = require('./routes/users');

// Public Health Check Endpoint for Docker
const { pool } = require('./database/init');
app.get('/api/health', async (req, res) => {
    try {
        const dbHealth = await pool.query('SELECT NOW()');
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            dbTime: dbHealth.rows[0].now
        });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});

// Protect all other API routes
app.use('/api', verifyToken);

// Admin Routes
app.use('/api/users', userRoutes); // Protected by requireRole('admin') inside the router

// General API routes (Apply role checks inside routes or here)
app.use('/api', apiRoutes);

// Protected static files for generated documents
// Must pass token as ?token=... in URL or Bearer Header for direct links
app.use('/files', verifyToken, express.static(path.join(__dirname, 'generated')));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Registration Form API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            generate: 'POST /api/generate',
            documents: 'GET /api/documents',
            document: 'GET /api/documents/:reference',
            download: 'GET /api/download/:reference/:language'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

// Initialize database and start server
async function startServer() {
    let retries = 10;
    while (retries > 0) {
        try {
            console.log('🚀 Starting Registration Form API...');

            // Initialize database
            await initializeDatabase();

            // Start server
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`✓ Server running on port ${PORT}`);
                console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`✓ API available at http://localhost:${PORT}`);
            });

            // Break loop on success
            break;

        } catch (error) {
            console.error(`✗ Failed to start server (Retries left: ${retries - 1}):`, error.message);
            retries -= 1;
            if (retries === 0) {
                console.error('✗ Exhausted all retries, shutting down.');
                process.exit(1);
            }
            // Wait 5 seconds before retrying
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    await closeDatabaseConnection();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    await closeDatabaseConnection();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
