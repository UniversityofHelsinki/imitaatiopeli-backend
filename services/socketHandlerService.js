const { logger } = require('../logger');

let connectedUsers = new Map();

const handleConnection = (io) => {
    return (socket) => {
        logger.info(`User connected: ${socket.id}`);

        socket.on('join-game', (data) => {
            const { userId, gameId, nickname } = data;

            // Check if user already exists in the map
            if (connectedUsers.has(userId)) {
                // User exists, check if this socket ID already exists
                const userData = connectedUsers.get(userId);
                const socketExists = Array.from(userData.sockets).some(
                    (s) => s.socketId === socket.id,
                );

                if (!socketExists) {
                    userData.sockets.add({
                        socketId: socket.id,
                        gameId: gameId,
                    });
                } else {
                    logger.warn(`Socket ${socket.id} already exists for user ${userId}`);
                }
            } else {
                // New user, create entry with socket set
                connectedUsers.set(userId, {
                    nickname: nickname,
                    sockets: new Set([
                        {
                            socketId: socket.id,
                            gameId: gameId,
                        },
                    ]),
                });
            }

            console.log('connectedUsers', connectedUsers);
        });

        socket.on('start-game', (data) => {
            const { gameId } = data;
            logger.info(`Game start requested for gameId: ${gameId} by socket: ${socket.id}`);

            try {
                // Get all sockets connected to this game
                const gameSockets = getGamePlayerSockets(gameId);

                if (gameSockets.length === 0) {
                    logger.warn(`No players found for game ${gameId}`);
                    socket.emit('start-game-error', {
                        gameId: gameId,
                        error: 'No players found for this game',
                    });
                    return;
                }

                // Broadcast to all players in the game
                gameSockets.forEach((player) => {
                    io.to(player.socketId).emit('game-started', {
                        gameId: gameId,
                        message: 'Game has started!',
                        startedBy: socket.id,
                    });
                });

                // Send confirmation back to the admin/starter
                socket.emit('start-game-success', {
                    gameId: gameId,
                    playersNotified: gameSockets.length,
                    message: 'Game started successfully',
                    timestamp: new Date().toISOString(),
                });

                logger.info(`Game ${gameId} started. Notified ${gameSockets.length} players.`);
            } catch (error) {
                logger.error(`Error starting game ${gameId}:`, error);
                socket.emit('start-game-error', {
                    gameId: gameId,
                    error: 'Failed to start game',
                });
            }
        });

        socket.on('disconnect', () => {
            logger.info(`User disconnected: ${socket.id}`);

            for (const [userId, userData] of connectedUsers.entries()) {
                const socketsArray = Array.from(userData.sockets);
                const socketIndex = socketsArray.findIndex((s) => s.socketId === socket.id);

                if (socketIndex !== -1) {
                    userData.sockets.delete(socketsArray[socketIndex]);

                    // If user has no more sockets, remove them entirely
                    if (userData.sockets.size === 0) {
                        connectedUsers.delete(userId);
                    }
                    break;
                }
            }
        });
    };
};

const getGamePlayerSockets = (gameId) => {
    const gameSockets = [];

    for (const [userId, userData] of connectedUsers.entries()) {
        for (const socketData of userData.sockets) {
            if (socketData.gameId === gameId) {
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

const getUserSockets = (userId) => {
    const userData = connectedUsers.get(userId);
    return userData ? Array.from(userData.sockets) : [];
};

const isUserConnected = (userId) => {
    const userData = connectedUsers.get(userId);
    return userData && userData.sockets.size > 0;
};

module.exports = {
    handleConnection,
    getUserSockets,
    isUserConnected,
    connectedUsers,
};
