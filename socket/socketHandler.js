const { logger } = require('../logger');
const connectionHandler = require('./handlers/socketConnectionHandler');
const gameHandler = require('./handlers/socketGameHandler');
const socketUserService = require('../socket/services/socketUserService');

const handleConnection = (io) => {
    return (socket) => {
        logger.info(`User connected: ${socket.id}`);

        socket.on('join-game', (data) => {
            connectionHandler.handleJoinGame(socket, data);
        });

        socket.on('start-game', (data) => {
            gameHandler.handleStartGame(socket, data, io);
        });

        socket.on('disconnect', () => {
            connectionHandler.handleDisconnect(socket);
        });
    };
};

module.exports = {
    handleConnection,
    getUserSockets: socketUserService.getUserSockets,
    isUserConnected: socketUserService.isUserConnected,
    connectedUsers: socketUserService.getConnectedUsers,
};
