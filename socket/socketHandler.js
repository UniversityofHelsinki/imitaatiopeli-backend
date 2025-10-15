const { logger } = require('../logger');
const connectionHandler = require('./handlers/socketConnectionHandler');
const gameHandler = require('./handlers/socketGameHandler');
const socketAnswerService = require('./services/socketAnswerService');
const socketUserService = require('../socket/services/socketUserService');
const questionHandler = require('./handlers/socketPlayerQuestionHandler');

const handleConnection = (io) => {
    return (socket) => {
        logger.info(`User connected: ${socket.id}`);

        socket.on('send-answer', async (data) => {
            await socketAnswerService.handleSendAnswer(socket, io, data);
        });

        socket.on('join-game', (data) => {
            connectionHandler.handleJoinGame(socket, data);
        });

        socket.on('start-game', (data) => {
            gameHandler.handleStartGame(socket, data, io);
        });

        socket.on('disconnect', () => {
            connectionHandler.handleDisconnect(socket);
        });

        socket.on('send-question', (data) => {
            questionHandler.handleSendQuestion(socket, data, io);
        });
    };
};

module.exports = {
    handleConnection,
    getUserSockets: socketUserService.getUserSockets,
    isUserConnected: socketUserService.isUserConnected,
    connectedUsers: socketUserService.getConnectedUsers,
};
