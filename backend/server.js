const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, closeDatabaseConnection } = require('./database/init');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for generated documents
app.use('/files', express.static(path.join(__dirname, 'generated')));

// API routes
app.use('/api', apiRoutes);

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

    } catch (error) {
        console.error('✗ Failed to start server:', error);
        process.exit(1);
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
