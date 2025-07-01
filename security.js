const ReverseProxyStrategy = require('passport-reverseproxy');
const ipaddr = require('ipaddr.js');
const crypto = require('crypto');
const { AUTHENTICATION_STRATEGY } = require('./utils/constants');
const SECRET_KEY = process.env.URL_SIGNER_KEY;

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

    app.use(function (req, res, next) {
        passport.authenticate(AUTHENTICATION_STRATEGY, { session: false })(req, res, next);
    });
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
