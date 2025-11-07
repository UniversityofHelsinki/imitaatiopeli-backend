const { logger } = require('../../logger');
const { getJudgeSummary } = require('../../services/dbService');
const socketGameService = require('../services/socketGameService');
const socketUserService = require('../services/socketUserService');
const { dbClient } = require('../../services/dbService');

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

const sendAnswersToJudge = (io, gameId, judgeId, questionId, answers) => {
    const judgeSockets = socketUserService.getUserSockets(judgeId);
    console.log('judgeId type:', typeof judgeId, 'value:', judgeId); // Add this line

    if (judgeSockets.length === 0) {
        logger.warn(`No sockets found for judge ${judgeId}`);
        return;
    }

    judgeSockets.forEach((socketInfo) => {
        if (socketInfo.gameId === parseInt(gameId, 10)) {
            io.to(socketInfo.socketId).emit('send_answers_to_judge', {
                answers,
                gameId,
                judgeId,
                questionId,
                timestamp: Date.now(),
            });
            logger.info(
                `Sent answer to judge ${judgeId} on socket ${socketInfo.socketId} for game ${gameId}`,
            );
        }
    });
};

const endJudging = (data) => {
    console.log('end-judging', data);
};

const gameSummary = async (io, socket, game) => {
    const sockets = [...socketUserService.getConnectedUsers().values()];

    const source = sockets.find((s) => [...s.sockets].find((ss) => ss.socketId === socket.id));
    const judge = Number.parseInt(
        [...socketUserService.getConnectedUsers().entries()].find(([_, o]) => o === source)[0],
    );

    const pairs = await dbClient(`/api/players/pairs/${game}/${judge}`);
    const answerer = pairs.find((pair) => pair.judge_id === judge)?.player_id;
    const answererSockets = socketUserService.getUserSockets(Number.parseInt(answerer)) || [];

    const summary = await getJudgeSummary(judge, game);

    socket.emit('judging-summary', summary);
    answererSockets.forEach((s) => io.to(s.socketId).emit('no-more-answers', true));
};

module.exports = {
    handleStartGame,
    sendAnswersToJudge,
    endJudging,
    gameSummary,
};
