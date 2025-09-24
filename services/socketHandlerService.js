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

// Export functions to access connectedUsers
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
