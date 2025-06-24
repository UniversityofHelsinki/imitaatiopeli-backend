'use strict';
const { AUTHENTICATION_STRATEGY } = require('../utils/constants');

const passport = require('passport');
const { Netmask } = require('netmask');

/**
 * Custom error class for authentication-related errors
 * @extends Error
 */
class AuthenticationError extends Error {
    /**
     * Create an authentication error
     * @param {string} message - Error message
     * @param {number} [statusCode=401] - HTTP status code
     */
    constructor(message, statusCode = 401) {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = statusCode;
    }
}

/**
 * Utility class for processing HTTP headers
 */
class HeaderProcessor {
    /**
     * Normalizes header configuration
     * @param {Object|null} headers - Raw header configuration
     * @returns {Object} Normalized header configuration
     */
    static normalize(headers) {
        if (!headers || Object.keys(headers).length === 0) {
            return {
                'X-Forwarded-User': { alias: 'username', required: true },
            };
        }
        return Object.entries(headers).reduce(
            (normalized, [name, value]) => ({
                ...normalized,
                [name]: HeaderProcessor.normalizeConfig(value),
            }),
            {},
        );
    }

    /**
     * Normalizes individual header configuration
     * @param {boolean|string|Object} value - Header configuration value
     * @returns {Object} Normalized header configuration object
     */
    static normalizeConfig(value) {
        if (typeof value === 'boolean') return { required: value };
        if (typeof value === 'string') return { alias: value, required: false };
        return value;
    }

    /**
     * Extracts and validates headers from request
     * @param {Object} req - Express request object
     * @param {Object} headerConfigs - Header configuration object
     * @returns {Object} Object containing extracted headers and user data
     * @throws {AuthenticationError} If required header is missing
     */
    static extract(req, headerConfigs) {
        const headers = {};
        const userData = {};

        Object.entries(headerConfigs).forEach(([headerName, config]) => {
            const headerValue = req.headers[headerName.toLowerCase().trim()] || '';

            // Validate required headers
            if (config?.required && !headerValue?.trim()) {
                throw new AuthenticationError(`Required header "${headerName}" missing`);
            }

            headers[headerName] = headerValue;
            userData[config?.alias || headerName] = headerValue;
        });

        return { headers, userData };
    }
}

/**
 * Passport strategy for reverse proxy authentication
 * @extends passport.Strategy
 */
class ReverseProxyStrategy extends passport.Strategy {
    /**
     * Creates a new ReverseProxyStrategy instance
     * @param {Function|Object} verify - Verification callback or options object
     * @param {Object} [options={}] - Strategy options
     */
    constructor(verify, options = {}) {
        super();
        this.name = AUTHENTICATION_STRATEGY;
        this.configure(verify, options);
    }

    /**
     * Configures the strategy with provided options
     * @param {Function|Object} verify - Verification callback or options object
     * @param {Object} options - Strategy options
     * @private
     */
    configure(verify, options) {
        const config = this.parseConfig(verify, options);
        this._verify = config.verifyFn;
        this._options = { headers: HeaderProcessor.normalize(config.options.headers) };
        this._whitelist = config.options.whitelist?.length
            ? new Netmask(config.options.whitelist)
            : null;
    }

    /**
     * Parses and normalizes strategy configuration
     * @param {Function|Object} verify - Verification callback or options object
     * @param {Object} options - Strategy options
     * @returns {Object} Parsed configuration
     * @private
     */
    parseConfig = (verify, options) => {
        const isVerifyFunction = typeof verify === 'function';
        return {
            verifyFn: isVerifyFunction ? verify : (headers, user, done) => done(null, user),
            options: isVerifyFunction ? options : verify || {},
        };
    };

    /**
     * Authenticates the request
     * @param {Object} req - Express request object
     * @private
     */
    authenticate(req) {
        try {
            this.validateProxyIp(req);
            const userData = HeaderProcessor.extract(req, this._options.headers);
            this.verifyUser(userData);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Validates the proxy IP address against whitelist
     * @param {Object} req - Express request object
     * @throws {AuthenticationError} If IP is not in whitelist
     * @private
     */
    validateProxyIp(req) {
        if (!this._whitelist) return;

        const proxyIp = req.connection.remoteAddress;
        if (!proxyIp || !this._whitelist.contains(proxyIp)) {
            throw new AuthenticationError(
                `Proxy IP ${proxyIp} not in whitelist ${this._whitelist.toString()}`,
            );
        }
    }

    /**
     * Verifies user data with configured verification function
     * @param {Object} param0 - Object containing headers and userData
     * @private
     */
    verifyUser({ headers, userData }) {
        this._verify(headers, userData, (err, user, info) => {
            if (err) return this.error(err);
            if (!user) return this.fail(info);
            this.success(user, info);
        });
    }

    /**
     * Handles authentication errors
     * @param {Error} error - Error object
     * @private
     */
    handleError(error) {
        if (error instanceof AuthenticationError) {
            this.fail(error.statusCode);
        } else {
            this.error(error);
        }
    }
}

module.exports = ReverseProxyStrategy;
