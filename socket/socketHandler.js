const { logger } = require('../logger');
const connectionHandler = require('./handlers/socketConnectionHandler');
const gameHandler = require('./handlers/socketGameHandler');
const socketAnswerService = require('./services/socketAnswerService');
const socketUserService = require('../socket/services/socketUserService');

const handleConnection = (io) => {
    return (socket) => {
        logger.info(`User connected: ${socket.id}`);

        // Register the event handler
        socket.on('send-answer', async (data) => {
            await socketAnswerService.handleSendAnswer(socket, io, data);
        });

        socket.on('sendQuestion', async (data) => {
            const { questionId, gameId, judgeId, question } = data;
            // Get judge's assigned player from database
            const assignedPlayer = await getJudgePlayer(gameId, judgeId);
            // Find player's WebSocket connection
            const playerConnection = connectedUsers.get('user_456');
            // Send question to specific player's socket
            io.to(playerConnection.socketId).emit('receiveQuestion', {
                questionText: "What's your favorite color?",
            });
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
    };
};

module.exports = {
    handleConnection,
    getUserSockets: socketUserService.getUserSockets,
    isUserConnected: socketUserService.isUserConnected,
    connectedUsers: socketUserService.getConnectedUsers,
};
