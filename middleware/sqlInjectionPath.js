const { logger } = require('../logger');

const SQL_PATTERNS = [
    /(\s+)(OR|AND)\s+\d+\s*=\s*\d+/i,
    /\bUNION\b.*\bSELECT\b/i,
    /-{2}/,
    /\/\*|\*\//,
    /;\s*(SELECT|DROP|DELETE|INSERT|UPDATE)/i,
];

const sqlInjectionInPath = (req, res, next) => {
    const decodedPath = decodeURIComponent(req.path);
    const fullUrl = decodeURIComponent(req.originalUrl);

    const toCheck = [decodedPath, fullUrl];

    for (const text of toCheck) {
        for (const pattern of SQL_PATTERNS) {
            if (pattern.test(text)) {
                logger.error('SQL injection blocked', {
                    path: req.path,
                    decodedPath,
                    originalUrl: req.originalUrl,
                    ip: req.ip,
                });

                return res.status(403).send('Access denied');
            }
        }
    }

    next();
};

module.exports = sqlInjectionInPath;
