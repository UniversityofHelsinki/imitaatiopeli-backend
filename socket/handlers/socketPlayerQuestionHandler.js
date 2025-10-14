const { logger } = require('../../logger');
const socketUserService = require('../services/socketUserService');
const dbApi = require('../../api/dbApi');

const handleSendQuestion = async (socket, data) => {
    const { judgeId, playerId, gameId, content } = data;

    try {
        const playerSockets = socketUserService.getUserSockets(parseInt(playerId, 10));
        const targetSocket = playerSockets.find((s) => s.gameId === parseInt(gameId, 10));
        console.log('targetSocket', targetSocket);

        if (!targetSocket) {
            throw new Error('Player is not connected');
        }

        const question = await dbApi.saveQuestion({
            judgeId,
            playerId,
            gameId,
            questionText: content,
        });

        socket.to(targetSocket.socketId).emit('send-question', {
            questionId: question.questionId,
            gameId: parseInt(gameId, 10),
            content: question.questionText,
            judgeId,
            created: question.created,
        });

        socket.emit('question-sent-success', {
            questionId: question.questionId,
            playerId,
            gameId: parseInt(gameId, 10),
        });

        logger.info(`Judge ${judgeId} sent question to player ${playerId} in game ${gameId}`);
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
