const express = require('express');
const router = express.Router();
const { pool } = require('../database/init');
const { generateDocuments } = require('../services/documentGenerator');
const { getFilePath } = require('../services/storageService');
const path = require('path');
const fs = require('fs');

// POST /api/generate - Generate documents
router.post('/generate', async (req, res) => {
    try {
        const { type, data } = req.body;

        // Validate input
        if (!type || !data) {
            return res.status(400).json({
                error: 'Missing required fields: type and data'
            });
        }

        if (!['particuliers', 'entreprise'].includes(type)) {
            return res.status(400).json({
                error: 'Invalid type. Must be "particuliers" or "entreprise"'
            });
        }

        // Generate documents
        const result = await generateDocuments(type, data);

        res.status(201).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Error generating documents:', error);
        res.status(500).json({
            error: 'Failed to generate documents',
            message: error.message
        });
    }
});

// GET /api/documents - Get all documents with pagination and filters
router.get('/documents', async (req, res) => {
    try {
        const {
            type,
            startDate,
            endDate,
            limit = 20,
            offset = 0
        } = req.query;

        let query = 'SELECT * FROM documents WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Add filters
        if (type) {
            query += ` AND document_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        // Add ordering and pagination
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM documents WHERE 1=1';
        const countParams = [];
        let countIndex = 1;

        if (type) {
            countQuery += ` AND document_type = $${countIndex}`;
            countParams.push(type);
            countIndex++;
        }

        if (startDate) {
            countQuery += ` AND created_at >= $${countIndex}`;
            countParams.push(startDate);
            countIndex++;
        }

        if (endDate) {
            countQuery += ` AND created_at <= $${countIndex}`;
            countParams.push(endDate);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            documents: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });

    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            error: 'Failed to fetch documents',
            message: error.message
        });
    }
});

// GET /api/documents/:reference - Get specific document by reference
router.get('/documents/:reference', async (req, res) => {
    try {
        const { reference } = req.params;

        const query = 'SELECT * FROM documents WHERE reference = $1';
        const result = await pool.query(query, [reference]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        res.json({
            success: true,
            document: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({
            error: 'Failed to fetch document',
            message: error.message
        });
    }
});

// GET /api/download/:reference/:language - Download document file
router.get('/download/:reference/:language', async (req, res) => {
    try {
        const { reference, language } = req.params;

        // Validate language
        if (!['fr', 'ar'].includes(language)) {
            return res.status(400).json({
                error: 'Invalid language. Must be "fr" or "ar"'
            });
        }

        // Get document from database
        const query = 'SELECT * FROM documents WHERE reference = $1';
        const result = await pool.query(query, [reference]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        const document = result.rows[0];
        const filePath = language === 'fr' ? document.file_path_fr : document.file_path_ar;
        const absolutePath = path.join(__dirname, '..', filePath);

        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                error: 'File not found on server'
            });
        }

        // Set headers for download
        const filename = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        // Stream file
        const fileStream = fs.createReadStream(absolutePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({
            error: 'Failed to download document',
            message: error.message
        });
    }
});

// GET /api/health - Health check
router.get('/health', async (req, res) => {
    try {
        const dbHealth = await pool.query('SELECT NOW()');
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            dbTime: dbHealth.rows[0].now
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// GET /api/config/models
router.get('/config/models', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cpe_models ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/config/models
router.post('/config/models', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const result = await pool.query(
            'INSERT INTO cpe_models (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/config/offers
router.get('/config/offers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM internet_offers ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/config/offers
router.post('/config/offers', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const result = await pool.query(
            'INSERT INTO internet_offers (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
