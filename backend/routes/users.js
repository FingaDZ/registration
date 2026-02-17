const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../database/init');
const { requireRole } = require('../middleware/roles');

// Get all users (Admin only)
router.get('/', requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create user (Admin only)
router.post('/', requireRole('admin'), async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
            [username, hash, role]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user (Admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
    const { id } = req.params;
    const { password, role } = req.body;

    try {
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET password_hash = $1, role = $2 WHERE id = $3',
                [hash, role, id]
            );
        } else {
            await pool.query(
                'UPDATE users SET role = $1 WHERE id = $2',
                [role, id]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (Admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
    const { id } = req.params;

    // Prevent deleting self (simple check)
    // We would need to know current user id from req.user
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
