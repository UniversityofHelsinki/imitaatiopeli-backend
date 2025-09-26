const { logger } = require('../../logger');
const socketGameService = require('../services/socketGameService');

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

module.exports = {
    handleStartGame,
};
