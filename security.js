const ReverseProxyStrategy = require('passport-reverseproxy');
const ipaddr = require('ipaddr.js');
const utf8 = require('utf8');
const crypto = require('crypto');

const SECRET_KEY = process.env.URL_SIGNER_KEY;

const concatenateArray = (data) => Array.prototype.concat([], data);
const decodeUser = (user) => {
    const eppn = utf8.decode(user.eppn);
    const eduPersonAffiliation = concatenateArray(
        utf8.decode(user.eduPersonAffiliation).split(';'),
    );
    const hyGroupCn = concatenateArray(utf8.decode(user.hyGroupCn).split(';'));
    const preferredLanguage = utf8.decode(user.preferredLanguage);
    const displayName = utf8.decode(user.displayName);
    return {
        eppn: eppn,
        eduPersonAffiliation: eduPersonAffiliation,
        hyGroupCn: hyGroupCn,
        preferredLanguage: preferredLanguage,
        displayName: displayName,
    };
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
                eduPersonAffiliation: { alias: 'eduPersonAffiliation', required: false },
                preferredlanguage: { alias: 'preferredLanguage', required: false },
                hyGroupCn: { alias: 'hyGroupCn', required: false },
                displayName: { alias: 'displayName', required: false },
            },
            whitelist: localhostIP,
        }),
    );

    app.use(passport.initialize());

    app.use((req, res, next) => {
        passport.authenticate('reverseproxy', { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(401).send('Not Authorized');
            }
            req.user = decodeUser(user);
            next();
        })(req, res, next);
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
