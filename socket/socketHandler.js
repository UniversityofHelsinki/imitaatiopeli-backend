const { logger } = require('../logger');
const connectionHandler = require('./handlers/socketConnectionHandler');
const gameHandler = require('./handlers/socketGameHandler');
const socketUserService = require('../socket/services/socketUserService');
const { sendAnswersToJudge } = require('./handlers/socketGameHandler');
const dbApi = require('../api/dbApi');

const handleConnection = (io) => {
    return (socket) => {
        logger.info(`User connected: ${socket.id}`);

        socket.on('send-answer', async (data) => {
            try {
                const { gameId, playerId, answer } = data;
                logger.info(`Received answer from player ${playerId} for game ${gameId}`);
                // Fetch judgeId from database
                const { judge_id } = await dbApi.getJudgeById(playerId, gameId);
                if (!judge_id) {
                    logger.warn(`No judge found for player ${playerId} in game ${gameId}`);
                    socket.emit('send-answer-error', {
                        error: 'Judge not found for this game',
                    });
                    return;
                }

                logger.info(`Sending answer to judge ${judge_id} for game ${gameId}`);
                sendAnswersToJudge(io, gameId, judge_id.toString(), answer);

                socket.emit('send-answer-success', {
                    message: 'Answer sent successfully',
                    gameId,
                });
            } catch (error) {
                logger.error(`Error handling send-answer: ${error.message}`);
                socket.emit('send-answer-error', {
                    error: 'Failed to send answer',
                });
            }
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
