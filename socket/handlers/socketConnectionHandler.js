const { logger } = require('../../logger');
const socketUserService = require('../../socket/services/socketUserService');
const dbService = require('../../services/dbService');

const handleJoinGame = async (socket, data) => {
    const { userId, gameId, nickname, session_token } = data;
    if (!userId || !gameId || !nickname || !session_token) {
        return;
    }
    console.log('Join game data received:', {
        socketId: socket.id,
        ...data,
    });
    try {
        const player = await dbService.getPlayerById(userId);
        if (!player || player?.session_token !== session_token) {
            return;
        }

        socketUserService.addUserSocket(userId, socket.id, gameId, nickname);
        logger.info(`User ${userId} joined game ${gameId} with socket ${socket.id}`);
        console.log(
            'connectedUsers',
            JSON.stringify(
                Array.from(socketUserService.getConnectedUsers()).map(([userId, userData]) => ({
                    userId,
                    nickname: userData.nickname,
                    sockets: Array.from(userData.sockets),
                })),
                null,
                2,
            ),
        );
        socket.emit('join-game-success', {
            userId,
            gameId: parseInt(gameId, 10),
            message: 'Successfully joined game',
        });
    } catch (error) {
        logger.warn(`Join game error: ${error.message}`);
        socket.emit('join-game-error', {
            error: error.message,
        });
    }
};

const handleDisconnect = (socket) => {
    logger.info(`User disconnected: ${socket.id}`);

    try {
        const removed = socketUserService.removeUserSocket(socket.id);
        if (removed) {
            logger.info(`Cleaned up socket ${socket.id} from connected users`);
        }
    } catch (error) {
        logger.error(`Error handling disconnect: ${error.message}`);
    }
};

module.exports = {
    handleJoinGame,
    handleDisconnect,
};
