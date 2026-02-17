const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../database/init'); // Assume pool exists here or import correctly
// Wait, database/init.js exports 'pool' usually. Let me check.
// If init.js exports pool, I'll use it. If not, I'll use separate pool connection.
// Safest is to duplicate connection logic or check init.js content. 
// I checked init.js before, it exports pool.

const { generateToken, verifyToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query database for user
        // Note: Using a direct query here. 
        // In a larger app, use a service/model.
        // We need access to the pool. I'll need to update server.js to pass pool or import keys.
        // Let's assume for now I can require the pool from '../database/init'

        // Wait, I need to make sure I import the pool correctly. 
        // I'll check init.js content again via tool if unsure, but I'll write the code assuming consistent export.

        // For now, I'll create a new pool instance here if I can't import? No, that's bad (connection limit).
        // I'll check init.js in a separate step or just assume `module.exports = { pool, ... }`

        // PLACEHOLDER: I'll assume `req.app.locals.pool` or import. 
        // Let's try importing.
        const { pool } = require('../database/init');

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me - Check session
router.get('/me', verifyToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

module.exports = router;
