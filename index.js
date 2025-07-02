require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const security = require('./security');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { logger } = require('./logger');
const crypto = require('crypto');
const { admin } = require('./routes/admin');
const { player } = require('./routes/player');

const ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
const port = process.env.OPENSHIFT_NODEJS_PORT || 8000;

app.use(compression());
app.use(cookieParser());

const allowedOrigin = process.env.ALLOWED_ORIGIN;

const corsOptions = {
    origin: (origin, callback) => {
        // Ensure origin is allowed or the request is same-origin
        if (origin === allowedOrigin || !origin) {
            callback(null, true); // Allow the request
        } else {
            logger.warn(`CORS denied: ${origin}`);
            callback(new Error('Not allowed by CORS')); // Deny the request
        }
    },
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS middleware to the app
app.use(cors(corsOptions));

app.use(
    helmet({
        contentSecurityPolicy: false, // Let nginx handle CSP
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
    }),
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

console.log(process.env.NODE_ENV);

// Enable 'trust proxy' only if the app is running in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true);
}

security.shibbolethAuthentication(app, passport);

const adminRouter = express.Router();
const playerRouter = express.Router();

app.use('/api', adminRouter);
admin(adminRouter);
app.use('/public', playerRouter);
player(playerRouter);

// Start the server
app.listen(port, ipaddress, () => {
    logger.info(`Node.js HTTP server is running on port ${port} and ip address ${ipaddress}`);
});
