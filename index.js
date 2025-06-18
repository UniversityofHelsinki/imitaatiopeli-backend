require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const routes = require('./api/routes');
const compression = require('compression');
const security = require('./security');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { logger } = require('./logger');
const crypto = require('crypto');

const ipaddress = process.env.AZURE_NODEJS_IP || 'localhost';

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

app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64'); // Recommended
    next();
});

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'none'"], // Block everything by default
                scriptSrc: ["'none'"], // No scripts allowed
                styleSrc: ["'none'"], // No styles allowed
                imgSrc: ["'none'"], // No images served
                connectSrc: ["'self'"], // Allow only same-origin API calls
                fontSrc: ["'none'"], // Fonts not needed
                mediaSrc: ["'none'"], // No media files (audio/video)
                objectSrc: ["'none'"], // Block <object> elements
                frameSrc: ["'none'"], // Block iframes (embedding other sites)
                frameAncestors: ["'none'"], // Prevent this app from being embedded in frames
                formAction: ["'none'"], // Prevent form submissions
                manifestSrc: ["'none'"], // No manifests needed
                baseUri: ["'none'"], // Prevent <base> tag hijacking
            },
        },
    }),
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable 'trust proxy' only if the app is running in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', true);
}

security.shibbolethAuthentication(app, passport);

const router = express.Router();
const studentRouter = express.Router();
const teacherRouter = express.Router();

app.use('/api', router);
routes(router);

// Specify the port to listen on
const port = 5000;

// Start the server
app.listen(port, ipaddress, () => {
    logger.info(`Node.js HTTP server is running on port ${port} and ip address ${ipaddress}`);
});
