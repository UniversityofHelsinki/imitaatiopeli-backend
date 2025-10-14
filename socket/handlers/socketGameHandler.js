const { logger } = require('../../logger');
const socketGameService = require('../services/socketGameService');
const socketUserService = require('../services/socketUserService');

const handleStartGame = (socket, data, io) => {
    const { gameId } = data;
    logger.info(`Game start requested for gameId: ${gameId} by socket: ${socket.id}`);

    try {
        const result = socketGameService.startGame(gameId, io, socket.id);

        if (!result.success) {
            socket.emit('start-game-error', {
                gameId: parseInt(gameId, 10),
                error: result.error,
            });
            return;
        }

        socket.emit('start-game-success', {
            gameId: parseInt(gameId, 10),
            message: `Game started successfully. ${result.playersNotified} players notified.`,
        });
    } catch (error) {
        logger.error(`Error starting game ${gameId}:`, error);
        socket.emit('start-game-error', {
            gameId: parseInt(gameId, 10),
            error: 'Failed to start game',
        });
    }
};

const sendAnswersToJudge = (io, gameId, judgeId, questionId, answers) => {
    const judgeSockets = socketUserService.getUserSockets(judgeId);
    if (judgeSockets.length === 0) {
        logger.warn(`No sockets found for judge ${judgeId}`);
        return;
    }

    judgeSockets.forEach((socketInfo) => {
        if (socketInfo.gameId === parseInt(gameId, 10)) {
            io.to(socketInfo.socketId).emit('send_answers_to_judge', {
                answers,
                gameId,
                judgeId,
                questionId,
                timestamp: Date.now(),
            });
            logger.info(
                `Sent answer to judge ${judgeId} on socket ${socketInfo.socketId} for game ${gameId}`,
            );
        }
    });
};

module.exports = {
    handleStartGame,
    sendAnswersToJudge,
};
