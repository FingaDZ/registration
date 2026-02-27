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
        // Obtenir la connexion DB depuis init.js
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
