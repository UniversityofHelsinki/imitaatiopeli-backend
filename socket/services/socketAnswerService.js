const { logger } = require('../../logger');
const { dbClient } = require('../../services/dbService');
const { sendAnswersToJudge } = require('../handlers/socketGameHandler');
const azureService = require('../../services/azureService');
const { getJudgeById } = require('../../api/dbApi');
const dbService = require('../../services/dbService');

const getAIPlayer = async () => {
    try {
        return await dbClient('/api/aiPlayer');
    } catch (error) {
        logger.error('Failed to fetch AI player:', error);
        throw new Error('Failed to retrieve AI player');
    }
};

const getAIAnswer = async (
    gameConfiguration,
    playerAnswer,
    question,
    judgeId,
    aiId,
    questionId,
    gameId,
) => {
    try {
        const config = extractConfiguration(gameConfiguration, playerAnswer);
        const messageBody = await buildConversationMessages(
            judgeId,
            aiId,
            gameId,
            config.modifiedPrompt,
        );

        return await azureService.getAIContextualAnswer(
            config.modifiedPrompt,
            config.temperature,
            config.languageModelId,
            playerAnswer,
            messageBody,
            config.url,
        );
    } catch (error) {
        logger.error('Failed to get AI answer:', error);
        throw new Error('Failed to generate AI answer');
    }
};

const extractConfiguration = (gameConfiguration, playerAnswer) => {
    const { configuration, languageModel } = gameConfiguration;
    const {
        ai_prompt: prompt,
        model_temperature: temperature,
        language_model: languageModelId,
        language_used: languageCode,
    } = configuration;

    const languageSuffix = {
        fi: `vastauksen tulisi olla noin ${playerAnswer.length} merkkiä pitkä eikä ylittää koskaan 500 merkkiä. Vastaa suomen kielellä.`,
        en: `the answer should be around ${playerAnswer.length} characters and never exceed 500 characters. Answer in English language.`,
        swe: `svaret bör vara cirka ${playerAnswer.length} tecken långt och får aldrig överstiga 50 tecken. Svara på svenska.`,
    };

    const suffix = languageSuffix[languageCode] || languageSuffix.en;
    const modifiedPrompt = `${prompt}, ${suffix}`;
    return {
        modifiedPrompt,
        temperature,
        languageModelId,
        url: languageModel.url,
    };
};

const buildConversationMessages = async (judgeId, aiId, gameId, systemPrompt) => {
    const judgeQuestions = await getJudgeQuestions(judgeId, gameId);

    const messages = [
        {
            role: 'system',
            content: systemPrompt,
        },
    ];

    for (const questionObj of judgeQuestions) {
        await addQuestionAnswerPair(messages, questionObj, aiId, gameId);
    }

    return { messages };
};

const getJudgeQuestions = async (judgeId, gameId) => {
    const judgeQuestions = await dbClient(`/api/getJudgeQuestions/${judgeId}/${gameId}`);
    console.log(judgeQuestions);
    return judgeQuestions;
};

const addQuestionAnswerPair = async (messages, questionObj, aiId, gameId) => {
    const playerQuestion = questionObj?.question_text;
    const playerQuestionId = questionObj?.question_id;

    if (!playerQuestion) return;

    messages.push({
        role: 'user',
        content: playerQuestion,
    });

    if (playerQuestionId) {
        const aiAnswer = await getAIAnswerForQuestion(aiId, playerQuestionId, gameId);
        if (aiAnswer?.answer_text) {
            messages.push({
                role: 'assistant',
                content: aiAnswer.answer_text,
            });
        }
    }
};

const getAIAnswerForQuestion = async (aiId, questionId, gameId) => {
    return await dbClient(`/api/getAIAnswerForQuestion/${aiId}/${questionId}/${gameId}`);
};

const getPlayerQuestionByQuestionIdAndGameId = async (questionId, gameId) => {
    try {
        return await dbClient(`/api/game/question/${questionId}/${gameId}`);
    } catch (error) {
        logger.error(`Failed to fetch question with ID ${questionId}:`, error);
        throw new Error('Failed to retrieve question from database');
    }
};

const validatePlayerAuth = async (playerId, gameId, session_token) => {
    if (!playerId || !gameId || !session_token) {
        return { valid: false, error: 'Invalid player or game id' };
    }

    const player = await dbService.getPlayerById(playerId);
    if (!player || player?.session_token !== session_token) {
        return { valid: false, error: 'Access denied. Insufficient permissions.' };
    }

    return { valid: true, error: null };
};

/**
 * Handle answer submission from player
 * @param {Object} socket - Socket instance
 * @param {Object} io - IO instance
 * @param {Object} data - Answer data
 */
const handleSendAnswer = async (socket, io, data) => {
    const { questionId, gameId, playerId, answer, session_token } = data;

    // Validate authentication
    const authResult = await validatePlayerAuth(playerId, gameId, session_token);
    if (!authResult.valid) {
        emitError(io, socket, authResult.error, gameId);
        return;
    }

    // Validate input
    const validationError = validateAnswerData(data);
    if (validationError) {
        emitError(io, socket, validationError, gameId);
        return;
    }

    logger.info(`Processing answer from player ${playerId} for game ${gameId}`, {
        questionId,
        answerLength: answer.length,
    });

    try {
        let answers = [];
        let storedAnswer = await saveAnswerToDatabase(data);
        logger.info(`Answer saved to database for player ${playerId}`);
        const question = await getPlayerQuestionByQuestionIdAndGameId(questionId, gameId);
        const gameConfiguration = await getGameConfigurationById(gameId);
        const aiPlayer = await getAIPlayer();
        const aiPlayerId = aiPlayer.player_id.toString();
        const judgeId = await getGameJudge(playerId, gameId);
        const aIAnswer = await getAIAnswer(
            gameConfiguration,
            answer,
            question,
            judgeId,
            aiPlayerId,
            questionId,
            gameId,
        );

        const safeAiResponse =
            aIAnswer?.answer.length > 500 ? aIAnswer?.answer.slice(0, 500) : aIAnswer?.answer;

        const aiData = {
            questionId,
            gameId,
            playerId: aiPlayerId,
            answer: safeAiResponse,
            is_pretender: true,
        };
        const savedAnswer = await saveAnswerToDatabase(aiData);
        answers.push(storedAnswer, savedAnswer);
        if (!judgeId) {
            emitError(io, socket, 'No judge assigned to this game', gameId);
            return;
        }
        // Send answers to judge
        await notifyJudge(io, gameId, judgeId, questionId, answers);
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

const getGameConfigurationById = async (gameId) => {
    try {
        const response = await dbClient(`/api/game/${gameId}`);
        return response;
    } catch (error) {
        logger.error(`Failed to fetch game configuration for game ${gameId}:`, error);
        throw new Error('Failed to retrieve game configuration');
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
const notifyJudge = async (io, gameId, judgeId, questionId, answers) => {
    try {
        sendAnswersToJudge(io, gameId, judgeId, questionId, answers);
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
    socket.emit('answer-sent-success', {
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
const emitError = (io, socket, errorMessage, gameId) => {
    io.to(socket).emit('send-answer-error', {
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
