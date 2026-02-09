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
        logger.error(error.message);
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

exports.getFinalGuessRes = async (judgeId, gameId) => {
    const url = `/api/getFinalGuessRes/${judgeId}/${gameId}`;
    return await dbClient(url);
};

exports.getHaveAllPlayersEndedGame = async (gameId) => {
    const url = `/api/getHaveAllPlayersEndedGame/${gameId}`;
    return await dbClient(url);
};

exports.saveJudgeFinalGuess = async (data) => {
    const { is_pretender } = data;
    const url = `/api/judge/finalGuess`;
    try {
        const payload = {
            ...data,
            is_pretender: !is_pretender,
        };
        return await dbClient(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
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

exports.getAllPromptTemplates = async () => {
    const url = `/api/promptTemplates`;
    return await dbClient(url);
};

exports.getJudgeStatus = async (playerId, gameId) => {
    const url = `/api/judge/${playerId}/${gameId}/status`;
    return await dbClient(url);
};

exports.getAnswererStatus = async (playerId, gameId) => {
    const url = `/api/answerer/${playerId}/${gameId}/status`;
    return await dbClient(url);
};

exports.playerReadyForFinalReview = async (playerId, gameId) => {
    const url = `/api/player/${playerId}/${gameId}/ready-for-final-review`;
    return await dbClient(url);
};

exports.dbClient = dbClient;
