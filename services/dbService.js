const dbHost = process.env.DB_HOST;
const { logger } = require('../logger');

const dbClient = async (path, options = { method: 'GET' }) => {
    try {
        const url = `${dbHost}${path.indexOf('/') !== 0 ? `/${path}` : path}`;
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Unexpected status code ${response.status} from ${url}`);
        }

        const contentType = response.headers.get('Content-Type');
        if (contentType?.startsWith('application/json')) {
            return await response.json();
        }
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

exports.savePlayer = async (req, res) => {
    const url = `/api/savePlayer`;
    return await dbClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
    });
};

exports.getPlayerById = async (playerId) => {
    const url = `/api/getplayerById/${playerId}`;
    return await dbClient(url);
};

exports.getHelloFromBackend = async () => {
    const url = `/api/hello`;
    return await dbClient(url);
};

exports.dbClient = dbClient;
