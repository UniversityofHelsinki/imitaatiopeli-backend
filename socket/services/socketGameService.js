const { logger } = require('../../logger');
const socketUserService = require('../../socket/services/socketUserService');

const getGamePlayerSockets = (gameId) => {
    const gameSockets = [];
    const connectedUsers = socketUserService.getConnectedUsers();
    const gameIdInt = parseInt(gameId, 10);

    for (const [userId, userData] of connectedUsers.entries()) {
        for (const socketData of userData.sockets) {
            if (socketData.gameId === gameIdInt) {
                gameSockets.push({
                    userId: userId,
                    nickname: userData.nickname,
                    socketId: socketData.socketId,
                    gameId: socketData.gameId,
                });
            }
        }
    }

    return gameSockets;
};

const startGame = (gameId, io, initiatorSocketId) => {
    const gameSockets = getGamePlayerSockets(gameId);

    if (gameSockets.length === 0) {
        logger.warn(`No players found for game ${gameId}`);
        return {
            success: false,
            error: 'No players found for this game',
        };
    }

    // Broadcast to all players in the game
    gameSockets.forEach((player) => {
        io.to(player.socketId).emit('game-started', {
            gameId: parseInt(gameId, 10),
            message: 'Game has started!',
            startedBy: initiatorSocketId,
        });
    });

    logger.info(`Game ${gameId} started. Notified ${gameSockets.length} players.`);

    return {
        success: true,
        playersNotified: gameSockets.length,
    };
};

const endGame = (gameId, io, initiatorSocketId) => {
    const gameSockets = getGamePlayerSockets(gameId);

    if (gameSockets.length === 0) {
        logger.warn(`No players found for game ${gameId}`);
        return {
            success: false,
            error: 'No players found for this game',
        };
    }

    // Broadcast to all players in the game
    gameSockets.forEach((player) => {
        io.to(player.socketId).emit('game-ended', {
            gameId: parseInt(gameId, 10),
            message: 'Game has ended!',
            startedBy: initiatorSocketId,
        });
    });

    logger.info(`Game ${gameId} ended. Notified ${gameSockets.length} players.`);

    return {
        success: true,
        playersNotified: gameSockets.length,
    };
};

module.exports = {
    getGamePlayerSockets,
    startGame,
    endGame,
};
