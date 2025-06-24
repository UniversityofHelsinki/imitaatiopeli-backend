const dbService = require('../services/dbService');
const { savePlayer } = require('./dbApi');
const messageKeys = require('../utils/message-keys');

jest.mock('../services/dbService');

describe('dbApi.addPlayer', () => {
    const mockReq = {
        body: { id: '10', roles: 'human', created_at: new Date().toISOString() },
        user: { eppn: 'baabenom' },
    };
    const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
    };

    let consoleErrorSpy;

    beforeAll(() => {
        // Mock console.error to suppress console output in tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        // Restore console.error after all tests
        consoleErrorSpy.mockRestore();
    });

    it('should respond with JSON on success', async () => {
        const mockResponse = { message: 'player-added' };
        dbService.savePlayer.mockResolvedValue(mockResponse);

        await savePlayer(mockReq, mockRes);

        expect(dbService.savePlayer).toHaveBeenCalledWith(mockReq, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should respond with error message on failure', async () => {
        const mockError = new Error('Failed to save player');
        dbService.savePlayer.mockRejectedValue(mockError);

        await savePlayer(mockReq, mockRes);

        expect(dbService.savePlayer).toHaveBeenCalledWith(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith([
            { message: messageKeys.ERROR_MESSAGE_FAILED_TO_ADD_PLAYER },
        ]);
        expect(console.error).toHaveBeenCalledWith(
            `Error POST /savePlayer ${mockError} USER ${mockReq.user.eppn}`,
        );
    });
});
