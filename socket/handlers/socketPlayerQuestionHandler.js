const { logger } = require('../../logger');
const socketUserService = require('../services/socketUserService');
const dbApi = require('../../api/dbApi');

const handleSendQuestion = async (socket, data) => {
    const { judgeId, gameId, content } = data;

    try {
        const playerSockets = socketUserService.getUserSockets(parseInt(playerId, 10));
        const targetSocket = playerSockets.find((s) => s.gameId === parseInt(gameId, 10));
        console.log('targetSocket', targetSocket);

        if (!targetSocket) {
            throw new Error('Player is not connected');
        }

        const question = await dbApi.saveQuestion({
            judgeId,
            gameId,
            questionText: content,
        });

        socket.to(targetSocket.socketId).emit('send-question', {
            questionId: question.question_id,
            gameId: parseInt(gameId, 10),
            content: question.question_text,
            judgeId,
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