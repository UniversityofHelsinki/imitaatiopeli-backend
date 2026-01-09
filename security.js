const ipaddr = require('ipaddr.js');
const crypto = require('crypto');
const { AUTHENTICATION_STRATEGY } = require('./utils/constants');
const ReverseProxyStrategy = require('./services/reverseProxyStragegy');
const Constants = require('./Constants');
const dbService = require('./services/dbService');

const SECRET_KEY = process.env.URL_SIGNER_KEY;

const validatePlayerAuthentication = async (req) => {
    const requiredHeaders = [
        'x-player-session-token',
        'x-player-nickname',
        'x-player-id',
        'x-player-game-id',
    ];
    const missingHeaders = requiredHeaders.some((header) => !req.headers[header]);

    if (missingHeaders) {
        console.log('Missing headers:', requiredHeaders);
        return { error: 'Access denied. Insufficient permissions.' };
    }

    const player = await dbService.getPlayerById(req.headers['x-player-id']);

    if (!player || player?.session_token !== req.headers['x-player-session-token']) {
        return { error: 'Access denied. Insufficient permissions.' };
    }

    return null;
};

/**
 * Contains the IP address of the local host.
 *
 * The variable `localhostIP` is instantiated with the processed
 * IP address string '127.0.0.1' using the `ipaddr.process()` method.
 */
const localhostIP = ipaddr.process('127.0.0.1');

/**
 * Configures Shibboleth authentication for the given Express application.
 *
 * @param {Object} app - The Express application instance.
 * @param {Object} passport - The Passport.js instance.
 *
 * This function sets up Passport.js to use the Reverse Proxy Strategy which handles the
 * authentication headers. These headers include 'eppn', 'eduPersonAffiliation', 'preferredLanguage',
 * 'hyGroupCn', and 'displayName'. The 'eppn' header is required, while the others are optional.
 *
 * The authentication middleware is applied to the Express application to ensure that
 * requests are authenticated based on the configured strategy. If authentication fails,
 * a 401 Unauthorized response is sent.
 */
const shibbolethAuthentication = (app, passport) => {
    passport.use(
        new ReverseProxyStrategy({
            headers: {
                eppn: { alias: 'eppn', required: true },
                preferredlanguage: { alias: 'preferredLanguage', required: false },
                hyGroupCn: { alias: 'hyGroupCn', required: false },
                displayName: { alias: 'displayName', required: false },
            },
            whitelist: localhostIP,
        }),
    );
    app.use(passport.initialize());

    app.use(async function (req, res, next) {
        if (
            req.path === '/public/games/join' ||
            req.path === '/public/hello' ||
            req.path.match(/^\/public\/games\/[^/]+$/) ||
            req.path.match(/^\/public\/games\/[^/]+\/players$/)
        ) {
            return next();
        }
        if (req.path.startsWith('/public')) {
            const validationError = await validatePlayerAuthentication(req);
            if (validationError) {
                return res.status(403).json(validationError);
            }
            next();
        } else {
            const hyGroupCn = req.headers['hygroupcn'];
            if (isAdminGroup(hyGroupCn)) {
                // Authenticate only if the group matches
                passport.authenticate(AUTHENTICATION_STRATEGY, { session: false })(req, res, next);
            } else {
                // Reject access if group doesn't match
                res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
            }
        }
    });
};

const isAdminGroup = (hyGroupCn) => {
    return hyGroupCn?.includes(Constants.ADMIN_GROUP);
};

const generateSignature = (data) => {
    return crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
};

const generateSignedUrl = (courseId) => {
    const data = courseId.toString();
    return generateSignature(data);
};

module.exports = {
    shibbolethAuthentication,
    generateSignedUrl,
};
