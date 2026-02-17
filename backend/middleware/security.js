const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

/**
 * IP Filter Middleware
 * Restricts access to local network (192.168.20.0/24) and localhost.
 */
const ipFilter = (req, res, next) => {
    // Get client IP (handle proxy/docker)
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Normalize IP (remove IPv6 prefix if present)
    const normalizedIp = clientIp.replace('::ffff:', '');

    // Allow localhost
    if (normalizedIp === '127.0.0.1' || normalizedIp === '::1') {
        return next();
    }

    // Allow 192.168.20.x
    if (normalizedIp.startsWith('192.168.20.')) {
        return next();
    }

    console.warn(`[Security] Blocked access from IP: ${normalizedIp}`);
    res.status(403).json({ error: 'Access denied: Restricted network' });
};

/**
 * Device Filter Middleware
 * Restricts access to Windows and Linux PCs (blocks mobile/tablets generally).
 */
const deviceFilter = (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const ua = userAgent.toLowerCase();

    // Must be Windows or Linux
    const isAllowedOS = ua.includes('windows') || ua.includes('linux');

    // Explicitly block Android/iOS (redundant if strict allow, but good for clarity)
    const isMobile = ua.includes('android') || ua.includes('iphone') || ua.includes('ipad');

    if (isAllowedOS && !isMobile) {
        return next();
    }

    // Exception: Allow if explicitly Postman/Insomnia for internal testing? No.

    console.warn(`[Security] Blocked device: ${userAgent}`);
    res.status(403).json({ error: 'Access denied: PC only (Windows/Linux)' });
};

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

module.exports = {
    ipFilter,
    deviceFilter,
    helmet,
    cors,
    limiter
};
