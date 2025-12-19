const { handleJoinGame, handleDisconnect } = require('./socketConnectionHandler');
const socketUserService = require('../../socket/services/socketUserService');
const dbService = require('../../services/dbService');

jest.mock('../../socket/services/socketUserService');
jest.mock('../../services/dbService');
jest.mock('../../logger');

describe('socketConnectionHandler', () => {
    let mockSocket;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSocket = {
            id: 'socket-123',
            emit: jest.fn(),
        };
    });

    describe('handleJoinGame', () => {
        const validData = {
            userId: '1',
            gameId: '10',
            nickname: 'TestUser',
            session_token: 'valid-token',
        };

        it('should return early if data is missing', async () => {
            await handleJoinGame(mockSocket, {});
            expect(dbService.getPlayerById).not.toHaveBeenCalled();
            expect(socketUserService.addUserSocket).not.toHaveBeenCalled();
        });

        it('should join game successfully with valid data and token', async () => {
            dbService.getPlayerById.mockResolvedValue({ session_token: 'valid-token' });
            socketUserService.getConnectedUsers.mockReturnValue(new Map());

            await handleJoinGame(mockSocket, validData);

            expect(dbService.getPlayerById).toHaveBeenCalledWith('1');
            expect(socketUserService.addUserSocket).toHaveBeenCalledWith(
                '1',
                'socket-123',
                '10',
                'TestUser',
            );
            expect(mockSocket.emit).toHaveBeenCalledWith('join-game-success', {
                userId: '1',
                gameId: 10,
                message: 'Successfully joined game',
            });
        });

        it('should return early if player not found', async () => {
            dbService.getPlayerById.mockResolvedValue(null);

            await handleJoinGame(mockSocket, validData);

            expect(socketUserService.addUserSocket).not.toHaveBeenCalled();
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should return early if session token is invalid', async () => {
            dbService.getPlayerById.mockResolvedValue({ session_token: 'wrong-token' });

            await handleJoinGame(mockSocket, validData);

            expect(socketUserService.addUserSocket).not.toHaveBeenCalled();
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });

        it('should emit error if something goes wrong', async () => {
            const error = new Error('Database error');
            dbService.getPlayerById.mockRejectedValue(error);

            await handleJoinGame(mockSocket, validData);

            expect(mockSocket.emit).toHaveBeenCalledWith('join-game-error', {
                error: error.message,
            });
        });
    });

    describe('handleDisconnect', () => {
        it('should call removeUserSocket', () => {
            socketUserService.removeUserSocket.mockReturnValue(true);

            handleDisconnect(mockSocket);

            expect(socketUserService.removeUserSocket).toHaveBeenCalledWith('socket-123');
        });

        it('should handle errors during disconnect', () => {
            socketUserService.removeUserSocket.mockImplementation(() => {
                throw new Error('Cleanup error');
            });

            // Should not throw
            expect(() => handleDisconnect(mockSocket)).not.toThrow();
        });
    });
});
