const dbService = require('../services/dbService');
const messageKeys = require('../utils/message-keys');

exports.getHelloFromDb = async (req, res) => {
    try {
        const response = await dbService.getHelloFromBackend();
        res.json(response);
    } catch (err) {
        res.status(500);
    }
};

exports.getAllLanguageModels = async (req, res) => {
    try {
        const response = await dbService.getAllLanguageModels();
        if (!response || response.length === 0) {
            return res.status(404).json({ message: 'No language models found' });
        }
        res.json(response);
    } catch (err) {
        console.error('Error fetching language models:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPlayerById = async (req, res) => {
    try {
        const playerId = req.params.playerId;
        const response = await dbService.getPlayerById(playerId);
        res.json(response);
    } catch (err) {
        res.status(500);
    }
};

exports.getJudgeById = async (playerId, gameId) => {
    try {
        const response = await dbService.getJudgeById(playerId, gameId);
        return response;
    } catch (err) {
        return null;
    }
};

exports.savePlayer = async (req, res) => {
    try {
        const response = await dbService.savePlayer(req, res);
        res.json(response);
    } catch (error) {
        console.error(`Error POST /savePlayer ${error} USER ${req.user.eppn}`);
        res.status(500);
        return res.json([
            {
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_ADD_PLAYER,
            },
        ]);
    }
};

exports.saveQuestion = async (questionData) => {
    try {
        return await dbService.saveQuestion(questionData);
    } catch (error) {
        console.error(`Error saving question: ${error.message}`);
        throw error;
    }
};

exports.getJudgeSummary = async (req, res) => {
    try {
        const { judgeId, gameId } = req.params;
        const response = await dbService.getJudgeSummary(judgeId, gameId, req.headers);
        res.json(response);
    } catch (error) {
        console.error('Error fetching judge summary:', error);
        res.status(500).json({ error: 'Failed to fetch judge summary' });
    }
};

exports.saveJudgeFinalGuess = async (req, res) => {
    try {
        const response = await dbService.saveJudgeFinalGuess(req, res);
        res.json(response);
    } catch (error) {
        console.error('Error saving final judge guess:', error);
        res.status(500).json({ error: 'Failed to save final judge guess' });
    }
};

