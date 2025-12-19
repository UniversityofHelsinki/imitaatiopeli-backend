const {
    handleStartGame,
    handleEndGame,
    sendAnswersToJudge,
    gameSummary,
} = require('./socketGameHandler');
const socketGameService = require('../services/socketGameService');
const socketUserService = require('../services/socketUserService');
const dbService = require('../../services/dbService');

jest.mock('../services/socketGameService');
jest.mock('../services/socketUserService');
jest.mock('../../services/dbService');
jest.mock('../../logger');

describe('socketGameHandler', () => {
    let mockSocket;
    let mockIo;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSocket = {
            id: 'socket-123',
            emit: jest.fn(),
        };
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
    });

    describe('handleStartGame', () => {
        it('should call socketGameService.startGame and emit success', () => {
            socketGameService.startGame.mockReturnValue({ success: true, playersNotified: 5 });

            handleStartGame(mockSocket, { gameId: '10' }, mockIo);

            expect(socketGameService.startGame).toHaveBeenCalledWith('10', mockIo, 'socket-123');
            expect(mockSocket.emit).toHaveBeenCalledWith('start-game-success', {
                gameId: 10,
                message: 'Game started successfully. 5 players notified.',
            });
        });

        it('should emit error if startGame fails', () => {
            socketGameService.startGame.mockReturnValue({ success: false, error: 'Fail' });

            handleStartGame(mockSocket, { gameId: '10' }, mockIo);

            expect(mockSocket.emit).toHaveBeenCalledWith('start-game-error', {
                gameId: 10,
                error: 'Fail',
            });
        });

        it('should handle exceptions', () => {
            socketGameService.startGame.mockImplementation(() => {
                throw new Error('Boom');
            });

            handleStartGame(mockSocket, { gameId: '10' }, mockIo);

            expect(mockSocket.emit).toHaveBeenCalledWith('start-game-error', {
                gameId: 10,
                error: 'Failed to start game',
            });
        });
    });

    describe('handleEndGame', () => {
        it('should call socketGameService.endGame and emit success', () => {
            socketGameService.endGame.mockReturnValue({ success: true, playersNotified: 5 });

            handleEndGame(mockSocket, { gameId: '10' }, mockIo);

            expect(socketGameService.endGame).toHaveBeenCalledWith('10', mockIo, 'socket-123');
            expect(mockSocket.emit).toHaveBeenCalledWith('end-game-success', {
                gameId: 10,
                message: 'Game ended successfully. 5 players notified.',
            });
        });

        it('should emit error if endGame fails', () => {
            socketGameService.endGame.mockReturnValue({ success: false, error: 'Fail' });

            handleEndGame(mockSocket, { gameId: '10' }, mockIo);

            expect(mockSocket.emit).toHaveBeenCalledWith('end-game-error', {
                gameId: 10,
                error: 'Fail',
            });
        });
    });

    describe('sendAnswersToJudge', () => {
        it('should emit send_answers_to_judge to relevant judge sockets', () => {
            socketUserService.getUserSockets.mockReturnValue([
                { socketId: 'judge-socket-1', gameId: 10 },
                { socketId: 'judge-socket-2', gameId: 20 },
            ]);

            sendAnswersToJudge(mockIo, '10', 'judge-1', 'q-1', ['ans1', 'ans2']);

            expect(mockIo.to).toHaveBeenCalledWith('judge-socket-1');
            expect(mockIo.to).not.toHaveBeenCalledWith('judge-socket-2');
            expect(mockIo.emit).toHaveBeenCalledWith(
                'send_answers_to_judge',
                expect.objectContaining({
                    answers: ['ans1', 'ans2'],
                    gameId: '10',
                    judgeId: 'judge-1',
                    questionId: 'q-1',
                }),
            );
        });

        it('should log warning if no sockets found for judge', () => {
            socketUserService.getUserSockets.mockReturnValue([]);

            sendAnswersToJudge(mockIo, '10', 'judge-1', 'q-1', []);

            expect(mockIo.to).not.toHaveBeenCalled();
        });
    });

    describe('gameSummary', () => {
        it('should emit judging-summary and no-more-answers', async () => {
            const mockConnectedUsers = new Map([
                [
                    1,
                    {
                        nickname: 'Judge',
                        sockets: new Set([{ socketId: 'socket-123', gameId: 10 }]),
                    },
                ],
                [
                    2,
                    {
                        nickname: 'Player',
                        sockets: new Set([{ socketId: 'player-socket', gameId: 10 }]),
                    },
                ],
            ]);
            socketUserService.getConnectedUsers.mockReturnValue(mockConnectedUsers);
            dbService.dbClient.mockResolvedValue([{ judge_id: 1, player_id: 2 }]);
            dbService.getJudgeSummary.mockResolvedValue({ some: 'summary' });
            socketUserService.getUserSockets.mockImplementation((id) => {
                if (id === 2) return [{ socketId: 'player-socket', gameId: 10 }];
                return [];
            });

            await gameSummary(mockIo, mockSocket, 10);

            expect(mockSocket.emit).toHaveBeenCalledWith('judging-summary', { some: 'summary' });
            expect(mockIo.to).toHaveBeenCalledWith('player-socket');
            expect(mockIo.emit).toHaveBeenCalledWith('no-more-answers', true);
        });
    });
});
