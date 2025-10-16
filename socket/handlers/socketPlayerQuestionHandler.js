const { logger } = require('../../logger');
const socketUserService = require('../services/socketUserService');
const dbApi = require('../../api/dbApi');
const { dbClient } = require('../../services/dbService');

const handleSendQuestion = async (socket, data) => {
    const { judgeId, gameId, questionText } = data;

    try {
        const pairs = await dbClient(`/api/players/pairs/${gameId}/${judgeId}`);
        const targetPlayer = pairs.find((pair) => pair.judge_id === judgeId).player_id;
        const playerSockets = socketUserService.getUserSockets(parseInt(targetPlayer));
        const targetSocket = playerSockets.find((s) => s.gameId === parseInt(gameId, 10));

        if (!targetSocket) {
            throw new Error('Target player is not connected');
        }

        const question = await dbApi.saveQuestion({
            judgeId,
            gameId,
            questionText,
        });

        socket.to(targetSocket.socketId).emit('send-question', {
            questionId: question.question_id,
            gameId: parseInt(gameId, 10),
            content: question.question_text,
            judgeId: judgeId,
            created: question.created,
        });

        socket.emit('question-sent-success', {
            questionId: question.questionId,
            judgeId,
            gameId: parseInt(gameId, 10),
        });

        logger.info(`Judge ${judgeId} sent question to player in game ${gameId}`);
    } catch (error) {
        logger.warn(`Send question error: ${error.message}`);
        socket.emit('question-sent-error', {
            error: error.message,
        });
    }
};

module.exports = {
    handleSendQuestion,
};
