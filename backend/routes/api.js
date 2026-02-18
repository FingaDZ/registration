const express = require('express');
const router = express.Router();
const { pool } = require('../database/init');
const { generateDocuments } = require('../services/documentGenerator');
const { getFilePath } = require('../services/storageService');
const path = require('path');
const fs = require('fs');
const { requireRole } = require('../middleware/roles');
const { searchThirdPartyByCIN, searchThirdPartyByNIF } = require('../services/dolibarrService');

// POST /api/check-duplicate - Check for duplicate clients before generation
router.post('/check-duplicate', async (req, res) => {
    try {
        const { type, data } = req.body;
        if (!type || !data) {
            return res.status(400).json({ error: 'Missing type or data' });
        }

        let dolibarrMatch = null;
        let localMatches = [];

        // --- Dolibarr check ---
        try {
            if (type === 'particuliers' && data.Num_CIN) {
                dolibarrMatch = await searchThirdPartyByCIN(data.Num_CIN);
            } else if (type === 'entreprise' && data.nif) {
                dolibarrMatch = await searchThirdPartyByNIF(data.nif);
            }
        } catch (e) {
            console.warn('[check-duplicate] Dolibarr search failed:', e.message);
        }

        // --- Local DB check ---
        try {
            let dbQuery, dbParams;
            if (type === 'particuliers' && data.Num_CIN) {
                dbQuery = `SELECT reference, document_type, created_at, user_data->>'Nom' as nom, user_data->>'Prenom' as prenom
                           FROM documents WHERE user_data->>'Num_CIN' = $1 ORDER BY created_at DESC LIMIT 5`;
                dbParams = [data.Num_CIN];
            } else if (type === 'entreprise' && data.nif) {
                dbQuery = `SELECT reference, document_type, created_at, user_data->>'raison_sociale' as nom
                           FROM documents WHERE user_data->>'nif' = $1 ORDER BY created_at DESC LIMIT 5`;
                dbParams = [data.nif];
            }
            if (dbQuery) {
                const result = await pool.query(dbQuery, dbParams);
                localMatches = result.rows;
            }
        } catch (e) {
            console.warn('[check-duplicate] DB search failed:', e.message);
        }

        const isDuplicate = !!dolibarrMatch || localMatches.length > 0;

        return res.json({
            isDuplicate,
            existingClient: dolibarrMatch ? {
                id: dolibarrMatch.id,
                name: dolibarrMatch.name,
                code_client: dolibarrMatch.code_client,
                email: dolibarrMatch.email,
                phone: dolibarrMatch.phone_mobile
            } : null,
            existingDocuments: localMatches
        });

    } catch (error) {
        console.error('[check-duplicate] Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/generate - Generate documents (Allowed for all users)
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

// GET /api/documents - Get all documents with pagination and filters (Admin Only)
router.get('/documents', requireRole('admin'), async (req, res) => {
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

// GET /api/documents/:reference - Get specific document by reference (Admin Only)
router.get('/documents/:reference', requireRole('admin'), async (req, res) => {
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

// GET /api/download/:reference/:language - Download document file (Allowed if authenticated)
// Note: We technically allow this even for Operators so they can download what they just created if needed.
// If strictly "No History Access", this prevents BROWSING. Direct link access is usually acceptable for "Impression".
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

// PUT /api/documents/:reference - Update document and regenerate files (Admin Only)
router.put('/documents/:reference', requireRole('admin'), async (req, res) => {
    try {
        const { reference } = req.params;
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({
                error: 'Missing required field: data'
            });
        }

        // Get existing document
        const existingQuery = 'SELECT * FROM documents WHERE reference = $1';
        const existingResult = await pool.query(existingQuery, [reference]);

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        const existingDoc = existingResult.rows[0];
        const type = existingDoc.document_type;

        // Delete old files
        const oldPathFr = path.join(__dirname, '..', existingDoc.file_path_fr);
        const oldPathAr = path.join(__dirname, '..', existingDoc.file_path_ar);

        if (fs.existsSync(oldPathFr)) fs.unlinkSync(oldPathFr);
        if (fs.existsSync(oldPathAr)) fs.unlinkSync(oldPathAr);

        // Regenerate documents with same reference
        const { generateDocumentFromTemplate, formatDate } = require('../services/documentGenerator');
        const TEMPLATES = {
            particuliers: {
                fr: path.join(__dirname, '../templates/MODELE Particuliers.docx'),
                ar: path.join(__dirname, '../templates/MODELE Particuliers AR.docx')
            },
            entreprise: {
                fr: path.join(__dirname, '../templates/MODEL ENTREPRISE.docx'),
                ar: path.join(__dirname, '../templates/MODEL ENTREPRISE AR.docx')
            }
        };

        // Format data
        const formattedData = {
            ...data,
            date: formatDate(data.date),
            date_delivery: formatDate(data.date_delivery),
            Date: formatDate(data.Date || data.date),
            Reference_client: '',
            contratid: reference
        };

        if (type === 'entreprise' && data.date_cin_gerant) {
            formattedData.date_cin_gerant = formatDate(data.date_cin_gerant);
        }

        if (data.internet_offer) {
            formattedData.offre_p = type === 'particuliers' ? data.internet_offer : '';
            formattedData.offre_e = type === 'entreprise' ? data.internet_offer : '';
        } else {
            formattedData.offre_p = '';
            formattedData.offre_e = '';
        }

        // Generate new documents
        const PizZip = require('pizzip');
        const Docxtemplater = require('docxtemplater');

        const generateDoc = (templatePath, data) => {
            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
            doc.render(data);
            return doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });
        };

        const docFr = generateDoc(TEMPLATES[type].fr, formattedData);
        const docAr = generateDoc(TEMPLATES[type].ar, formattedData);

        // Save new files with same paths
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const outputDir = path.join(__dirname, '../generated', year.toString(), month, day);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filenameFr = `${reference}_fr.docx`;
        const filenameAr = `${reference}_ar.docx`;
        const pathFr = path.join(outputDir, filenameFr);
        const pathAr = path.join(outputDir, filenameAr);

        fs.writeFileSync(pathFr, docFr);
        fs.writeFileSync(pathAr, docAr);

        const relativePathFr = path.relative(path.join(__dirname, '..'), pathFr);
        const relativePathAr = path.relative(path.join(__dirname, '..'), pathAr);

        // Update database
        const updateQuery = `
            UPDATE documents 
            SET user_data = $1, file_path_fr = $2, file_path_ar = $3
            WHERE reference = $4
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [
            JSON.stringify(formattedData),
            relativePathFr,
            relativePathAr,
            reference
        ]);

        res.json({
            success: true,
            document: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({
            error: 'Failed to update document',
            message: error.message
        });
    }
});

// DELETE /api/documents/:reference - Delete document and files (Admin Only)
router.delete('/documents/:reference', requireRole('admin'), async (req, res) => {
    try {
        const { reference } = req.params;

        // Get document to find file paths
        const query = 'SELECT * FROM documents WHERE reference = $1';
        const result = await pool.query(query, [reference]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Document not found'
            });
        }

        const document = result.rows[0];

        // Delete files
        const pathFr = path.join(__dirname, '..', document.file_path_fr);
        const pathAr = path.join(__dirname, '..', document.file_path_ar);

        if (fs.existsSync(pathFr)) {
            fs.unlinkSync(pathFr);
        }

        if (fs.existsSync(pathAr)) {
            fs.unlinkSync(pathAr);
        }

        // Delete from database
        const deleteQuery = 'DELETE FROM documents WHERE reference = $1';
        await pool.query(deleteQuery, [reference]);

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            error: 'Failed to delete document',
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

// POST /api/config/models (Admin Only)
router.post('/config/models', requireRole('admin'), async (req, res) => {
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

// POST /api/config/offers (Admin Only)
router.post('/config/offers', requireRole('admin'), async (req, res) => {
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
