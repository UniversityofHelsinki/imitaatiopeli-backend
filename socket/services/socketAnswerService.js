const { logger } = require('../../logger');
const { dbClient } = require('../../services/dbService');
const { sendAnswersToJudge } = require('../handlers/socketGameHandler');
const { getJudgeById } = require('../../api/dbApi');

/**
 * Handle answer submission from player
 * @param {Object} socket - Socket instance
 * @param {Object} io - IO instance
 * @param {Object} data - Answer data
 */
const handleSendAnswer = async (socket, io, data) => {
    const { questionId, gameId, playerId, answer } = data;

    // Validate input
    const validationError = validateAnswerData(data);
    if (validationError) {
        emitError(socket, validationError, gameId);
        return;
    }

    logger.info(`Processing answer from player ${playerId} for game ${gameId}`, {
        questionId,
        answerLength: answer.length,
    });

    try {
        // Save answer to database
        await saveAnswerToDatabase(data);
        logger.info(`Answer saved to database for player ${playerId}`);

        // Get and validate judge
        const judgeId = await getGameJudge(playerId, gameId);
        if (!judgeId) {
            emitError(socket, 'No judge assigned to this game', gameId);
            return;
        }

        // Send answer to judge
        await notifyJudge(io, gameId, judgeId, answer);
        logger.info(`Answer forwarded to judge ${judgeId} for game ${gameId}`);

        // Confirm success to player
        emitSuccess(socket, gameId);
    } catch (error) {
        logger.error(`Failed to process answer for player ${playerId} in game ${gameId}:`, error);
        emitError(socket, getErrorMessage(error), gameId);
    }
};

/**
 * Validate answer data
 * @param {Object} data - Answer data to validate
 * @returns {string|null} Error message or null if valid
 */
const validateAnswerData = (data) => {
    const { gameId, playerId, answer } = data;

    if (!gameId) return 'Game ID is required';
    if (!playerId) return 'Player ID is required';
    if (!answer || typeof answer !== 'string' || answer.trim() === '') {
        return 'Answer is required and must be a non-empty string';
    }

    return null;
};

/**
 * Save answer to database
 * @param {Object} data - Answer data
 */
const saveAnswerToDatabase = async (data) => {
    try {
        return await dbClient('/api/game/answer', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        logger.error('Database save failed:', error);
        throw new Error('Failed to save answer to database');
    }
};

/**
 * Get judge for the game
 * @param {string} playerId
 * @param {string} gameId
 * @returns {string|null} Judge ID or null if not found
 */
const getGameJudge = async (playerId, gameId) => {
    try {
        const result = await getJudgeById(playerId, gameId);
        return result && result.judge_id ? result.judge_id.toString() : null;
    } catch (error) {
        logger.error(`Failed to fetch judge for game ${gameId}:`, error);
        throw new Error('Failed to retrieve game judge information');
    }
};

/**
 * Notify judge about new answer
 * @param {Object} io - IO instance
 * @param {string} gameId
 * @param {string} judgeId
 * @param {string} answer
 */
const notifyJudge = async (io, gameId, judgeId, answer) => {
    try {
        sendAnswersToJudge(io, gameId, judgeId, answer);
    } catch (error) {
        logger.error(`Failed to notify judge ${judgeId}:`, error);
        throw new Error('Failed to send answer to judge');
    }
};

/**
 * Emit success response to client
 * @param {Object} socket
 * @param {string} gameId
 */
const emitSuccess = (socket, gameId) => {
    socket.emit('send-answer-success', {
        message: 'Answer submitted successfully',
        gameId,
        timestamp: Date.now(),
    });
};

/**
 * Emit error response to client
 * @param {Object} socket
 * @param {string} errorMessage
 * @param {string} gameId
 */
const emitError = (socket, errorMessage, gameId) => {
    socket.emit('send-answer-error', {
        error: errorMessage,
        gameId,
        timestamp: Date.now(),
    });
};

/**
 * Get sanitized error message for client
 * @param {Error} error
 * @returns {string} Sanitized error message
 */
const getErrorMessage = (error) => {
    // Don't expose internal error details to client
    if (error.message.includes('database') || error.message.includes('Database')) {
        return 'Unable to process your answer at this time. Please try again.';
    }
    return error.message || 'An unexpected error occurred';
};

module.exports = {
    handleSendAnswer,
    validateAnswerData,
    saveAnswerToDatabase,
    getGameJudge,
    notifyJudge,
    emitSuccess,
    emitError,
    getErrorMessage,
};
