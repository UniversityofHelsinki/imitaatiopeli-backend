const socketGameService = require('./socketGameService');
const socketUserService = require('../../socket/services/socketUserService');

jest.mock('../../socket/services/socketUserService');
jest.mock('../../logger');

describe('socketGameService', () => {
    let mockIo;

    beforeEach(() => {
        jest.clearAllMocks();
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
    });

    const mockConnectedUsers = new Map([
        [
            1,
            {
                nickname: 'User1',
                sockets: new Set([
                    { socketId: 'socket1', gameId: 10 },
                    { socketId: 'socket2', gameId: 20 },
                ]),
            },
        ],
        [
            2,
            {
                nickname: 'User2',
                sockets: new Set([{ socketId: 'socket3', gameId: 10 }]),
            },
        ],
    ]);

    describe('getGamePlayerSockets', () => {
        it('should return all sockets for a given gameId', () => {
            socketUserService.getConnectedUsers.mockReturnValue(mockConnectedUsers);

            const result = socketGameService.getGamePlayerSockets(10);

            expect(result).toHaveLength(2);
            expect(result).toContainEqual({
                userId: 1,
                nickname: 'User1',
                socketId: 'socket1',
                gameId: 10,
            });
            expect(result).toContainEqual({
                userId: 2,
                nickname: 'User2',
                socketId: 'socket3',
                gameId: 10,
            });
        });

        it('should return empty array if no players in game', () => {
            socketUserService.getConnectedUsers.mockReturnValue(mockConnectedUsers);

            const result = socketGameService.getGamePlayerSockets(99);

            expect(result).toEqual([]);
        });
    });

    describe('startGame', () => {
        it('should notify all players and return success', () => {
            socketUserService.getConnectedUsers.mockReturnValue(mockConnectedUsers);

            const result = socketGameService.startGame(10, mockIo, 'initiator-id');

            expect(result.success).toBe(true);
            expect(result.playersNotified).toBe(2);
            expect(mockIo.to).toHaveBeenCalledWith('socket1');
            expect(mockIo.to).toHaveBeenCalledWith('socket3');
            expect(mockIo.emit).toHaveBeenCalledWith('game-started', {
                gameId: 10,
                message: 'Game has started!',
                startedBy: 'initiator-id',
            });
        });

        it('should return error if no players found', () => {
            socketUserService.getConnectedUsers.mockReturnValue(new Map());

            const result = socketGameService.startGame(99, mockIo, 'initiator-id');

            expect(result.success).toBe(false);
            expect(result.error).toBe('No players found for this game');
        });
    });

    describe('endGame', () => {
        it('should notify all players and return success', () => {
            socketUserService.getConnectedUsers.mockReturnValue(mockConnectedUsers);

            const result = socketGameService.endGame(10, mockIo, 'initiator-id');

            expect(result.success).toBe(true);
            expect(result.playersNotified).toBe(2);
            expect(mockIo.to).toHaveBeenCalledWith('socket1');
            expect(mockIo.to).toHaveBeenCalledWith('socket3');
            expect(mockIo.emit).toHaveBeenCalledWith('game-ended', {
                gameId: 10,
                message: 'Game has ended!',
                startedBy: 'initiator-id',
            });
        });

        it('should return error if no players found', () => {
            socketUserService.getConnectedUsers.mockReturnValue(new Map());

            const result = socketGameService.endGame(99, mockIo, 'initiator-id');

            expect(result.success).toBe(false);
            expect(result.error).toBe('No players found for this game');
        });
    });
});
