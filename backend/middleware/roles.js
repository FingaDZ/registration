/**
 * Middleware to check user role
 * @param {string|string[]} roles - Single role or array of allowed roles
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Admin always allowed
        if (req.user.role === 'admin') {
            return next();
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    };
};

module.exports = { requireRole };
