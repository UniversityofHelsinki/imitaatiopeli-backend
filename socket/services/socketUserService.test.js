const socketUserService = require('./socketUserService');

describe('socketUserService', () => {
    beforeEach(() => {
        // Clear the internal Map before each test
        const connectedUsers = socketUserService.getConnectedUsers();
        connectedUsers.clear();
    });

    describe('addUserSocket', () => {
        it('should add a new user and socket', () => {
            socketUserService.addUserSocket(1, 'socket1', 10, 'User1');
            expect(socketUserService.isUserConnected(1)).toBe(true);
            expect(socketUserService.getUserSockets(1)).toEqual([
                { socketId: 'socket1', gameId: 10 },
            ]);
        });

        it('should handle userId as string', () => {
            socketUserService.addUserSocket('1', 'socket1', 10, 'User1');
            expect(socketUserService.isUserConnected(1)).toBe(true);
            expect(socketUserService.getUserSockets(1)).toEqual([
                { socketId: 'socket1', gameId: 10 },
            ]);
        });

        it('should add multiple sockets for the same user', () => {
            socketUserService.addUserSocket(1, 'socket1', 10, 'User1');
            socketUserService.addUserSocket(1, 'socket2', 10, 'User1');
            const sockets = socketUserService.getUserSockets(1);
            expect(sockets).toHaveLength(2);
            expect(sockets).toContainEqual({ socketId: 'socket1', gameId: 10 });
            expect(sockets).toContainEqual({ socketId: 'socket2', gameId: 10 });
        });

        it('should throw error if adding the same socketId for the same user', () => {
            socketUserService.addUserSocket(1, 'socket1', 10, 'User1');
            expect(() => {
                socketUserService.addUserSocket(1, 'socket1', 10, 'User1');
            }).toThrow('Socket socket1 already exists for user 1');
        });
    });

    describe('removeUserSocket', () => {
        it('should remove a socket and return true', () => {
            socketUserService.addUserSocket(1, 'socket1', 10, 'User1');
            const result = socketUserService.removeUserSocket('socket1');
            expect(result).toBe(true);
            expect(socketUserService.isUserConnected(1)).toBe(false);
        });

        it('should remove only the specified socket', () => {
            socketUserService.addUserSocket(1, 'socket1', 10, 'User1');
            socketUserService.addUserSocket(1, 'socket2', 10, 'User1');
            socketUserService.removeUserSocket('socket1');
            expect(socketUserService.isUserConnected(1)).toBe(true);
            expect(socketUserService.getUserSockets(1)).toEqual([
                { socketId: 'socket2', gameId: 10 },
            ]);
        });

        it('should return false if socket does not exist', () => {
            const result = socketUserService.removeUserSocket('nonexistent');
            expect(result).toBe(false);
        });

        it('should remove user from Map when last socket is removed', () => {
            socketUserService.addUserSocket(1, 'socket1', 10, 'User1');
            socketUserService.removeUserSocket('socket1');
            expect(socketUserService.getConnectedUsers().has(1)).toBe(false);
        });
    });

    describe('getUserSockets', () => {
        it('should return empty array for non-connected user', () => {
            expect(socketUserService.getUserSockets(999)).toEqual([]);
        });
    });

    describe('isUserConnected', () => {
        it('should return false for non-connected user', () => {
            expect(socketUserService.isUserConnected(999)).toBe(false);
        });
    });
});
