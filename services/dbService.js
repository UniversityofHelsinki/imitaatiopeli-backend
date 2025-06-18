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

exports.dbClient = dbClient;

exports.getHelloFromBackend = async () => {
    const url = `/api/hello`;
    return await dbClient(url);
};
