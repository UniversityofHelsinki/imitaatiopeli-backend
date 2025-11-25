require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const server = createServer(app);
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
const { handleConnection } = require('./socket/socketHandler');
const sqlInjectionInPath = require('./middleware/sqlInjectionPath');

const ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
const port = process.env.OPENSHIFT_NODEJS_PORT || 8000;

app.use(sqlInjectionInPath);

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

const io = new Server(server, {
    connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
    },
    cors: {
        origin: allowedOrigin,
        methods: ['GET', 'POST'],
    },
});

app.use(
    helmet({
        contentSecurityPolicy: false, // Let nginx handle CSP
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
    }),
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

// Socket.IO connection handling
io.on('connection', handleConnection(io));

app.get('/api/test-sanitization', (req, res) => {
    res.json({
        originalQuery: req.query,
        message: 'All parameters are sanitized',
    });
});

// Start the server
server.listen(port, ipaddress, () => {
    logger.info(
        `Node.js HTTP server with Socket.IO is running on port ${port} and ip address ${ipaddress}`,
    );
});
