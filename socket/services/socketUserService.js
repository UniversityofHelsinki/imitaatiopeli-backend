let connectedUsers = new Map();

const addUserSocket = (userId, socketId, gameId, nickname) => {
    if (connectedUsers.has(userId)) {
        const userData = connectedUsers.get(userId);
        const socketExists = Array.from(userData.sockets).some((s) => s.socketId === socketId);

        if (!socketExists) {
            userData.sockets.add({
                socketId: socketId,
                gameId: parseInt(gameId, 10),
            });
        } else {
            throw new Error(`Socket ${socketId} already exists for user ${userId}`);
        }
    } else {
        connectedUsers.set(userId, {
            nickname: nickname,
            sockets: new Set([
                {
                    socketId: socketId,
                    gameId: parseInt(gameId, 10),
                },
            ]),
        });
    }
};

const removeUserSocket = (socketId) => {
    for (const [userId, userData] of connectedUsers.entries()) {
        const socketsArray = Array.from(userData.sockets);
        const socketIndex = socketsArray.findIndex((s) => s.socketId === socketId);

        if (socketIndex !== -1) {
            userData.sockets.delete(socketsArray[socketIndex]);

            if (userData.sockets.size === 0) {
                connectedUsers.delete(userId);
            }
            return true;
        }
    }
    return false;
};

const getUserSockets = (userId) => {
    const userData = connectedUsers.get(userId);
    return userData ? Array.from(userData.sockets) : [];
};

const isUserConnected = (userId) => {
    const userData = connectedUsers.get(userId);
    return userData && userData.sockets.size > 0;
};

const getConnectedUsers = () => {
    return connectedUsers;
};

module.exports = {
    addUserSocket,
    removeUserSocket,
    getUserSockets,
    isUserConnected,
    getConnectedUsers,
};
