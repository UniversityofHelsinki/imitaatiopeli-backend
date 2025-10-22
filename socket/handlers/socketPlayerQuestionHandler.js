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

        const question = await dbApi.saveQuestion({
            judgeId,
            gameId,
            questionText,
        });

        if (playerSockets.length === 0) {
            logger.warn(`No sockets found for judge ${judgeId}`);
            return;
        }

        playerSockets.forEach((socketInfo) => {
            if (socketInfo.gameId === parseInt(gameId, 10)) {
                socket.to(socketInfo.socketId).emit('send-question', {
                    questionId: question.question_id,
                    gameId: parseInt(gameId, 10),
                    content: question.question_text,
                    judgeId: judgeId,
                    created: question.created,
                });
            }
        });

        playerSockets.forEach((socketInfo) => {
            if (socketInfo.gameId === parseInt(gameId, 10)) {
                socket.to(socketInfo.socketId).emit('question-sent-success', {
                    questionId: question.questionId,
                    judgeId,
                    gameId: parseInt(gameId, 10),
                });
            }
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
