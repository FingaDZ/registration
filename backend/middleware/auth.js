const jwt = require('jsonwebtoken');

// Secret key for signing tokens — MUST be set via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('\x1b[31m✗ FATAL: JWT_SECRET environment variable is not set!\x1b[0m');
    console.error('  Set it in docker-compose.yml or .env before starting the server.');
    process.exit(1);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object {id, username, role}
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
};

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
    let token;

    // Check header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // Check query param (fallback for downloads/images)
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Access denied: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Access denied: Invalid token' });
    }
};

module.exports = {
    generateToken,
    verifyToken
};
