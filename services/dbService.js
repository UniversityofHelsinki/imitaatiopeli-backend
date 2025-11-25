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
    const url = `/api/getPlayerById/${playerId}`;
    return await dbClient(url);
};

exports.getJudgeById = async (playerId, gameId) => {
    const url = `/api/getJudgeById/${playerId}/${gameId}`;
    return await dbClient(url);
};

exports.getHelloFromBackend = async () => {
    const url = `/api/hello`;
    return await dbClient(url);
};

exports.getAllLanguageModels = async () => {
    const url = `/api/languageModels`;
    return await dbClient(url);
};

exports.getLanguageModelById = async (languageModelId) => {
    const url = `/api/languageModelUrl/${languageModelId}`;
    return await dbClient(url);
};

exports.saveQuestion = async (questionData) => {
    const url = `/api/game/saveQuestion`;
    return await dbClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
    });
};

exports.getPlayroomJudgePlayerPairs = async (gameId) => {
    const url = `/api/games/${gameId}/playroomPlayerPairs`;
    return await dbClient(url);
};

exports.getJudgeSummary = async (judgeId, gameId) => {
    const url = `/api/judge/summary/${judgeId}/${gameId}`;
    return await dbClient(url);
};

exports.saveJudgeFinalGuess = async (data) => {
    const url = `/api/judge/finalGuess`;
    try {
        return await dbClient(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    } catch (error) {
        logger.error('Error saving final judge guess:', error);
        throw error;
    }
};

exports.getGamesForUser = async (eppn) => {
    const url = `/api/games/${eppn}`;
    return await dbClient(url);
};

exports.getAdminGameSummary = async (gameId, eppn) => {
    const url = `/api/games/${gameId}/${eppn}/summary`;
    return await dbClient(url);
};
exports.dbClient = dbClient;
