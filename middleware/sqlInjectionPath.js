const { logger } = require('../logger');

const SQL_PATTERNS = [
    // Original patterns
    /(\s+)(OR|AND)\s+\d+\s*=\s*\d+/i, // AND 1=1
    /\bUNION\b.*\bSELECT\b/i, // UNION SELECT
    /-{2}/, // SQL comment --
    /\/\*|\*\//, // Block comments
    /;\s*(SELECT|DROP|DELETE|INSERT|UPDATE)/i, // Stacked queries

    /'[\s\S]*?(AND|OR)[\s\S]*?'/i, // ' AND ' or ' OR '
    /"[\s\S]*?(AND|OR)[\s\S]*?"/i, // " AND " or " OR "
    /'\s+AND\s+'/i, // ' AND '
    /'\s+OR\s+'/i, // ' OR '
    /'\s*=\s*'/i, // '='
    /'\s*;\s*/i, // ';
];

const sqlInjectionInPath = (req, res, next) => {
    const decodedPath = decodeURIComponent(req.path);
    const fullUrl = decodeURIComponent(req.originalUrl);

    const toCheck = [
        decodedPath,
        fullUrl,
        JSON.stringify(req.headers),
        JSON.stringify(req.query),
        JSON.stringify(req.body),
    ];

    for (const text of toCheck) {
        for (const pattern of SQL_PATTERNS) {
            if (pattern.test(text)) {
                logger.error('SQL injection blocked', {
                    path: req.path,
                    decodedPath,
                    originalUrl: req.originalUrl,
                    headers: req.headers,
                    query: req.query,
                    body: req.body,
                    ip: req.ip,
                    matchedPattern: pattern.toString(),
                });

                return res.status(403).send('Access denied');
            }
        }
    }

    next();
};

module.exports = sqlInjectionInPath;
