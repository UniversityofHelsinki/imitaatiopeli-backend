const { handleSendGuessToAnswer } = require('./socketPlayerGuessHandler');
const { dbClient } = require('../../services/dbService');
const { saveGuessToDatabase } = require('../services/socketGuessService');

jest.mock('../../services/dbService');
jest.mock('../services/socketGuessService');

describe('socketPlayerGuessHandler', () => {
    let mockSocket;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSocket = {
            id: 'socket-123',
            emit: jest.fn(),
        };
        // Mock console.error and console.log to keep test output clean
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
        console.log.mockRestore();
    });

    it('should save guess with correct mapping if data is valid', async () => {
        const data = { confidence: 5, answerId: 100, argument: 'I think so' };
        dbClient.mockImplementation((url) => {
            if (url === '/api/getAnswerById/100') {
                return Promise.resolve({ answer_id: 100, question_id: 200, is_pretender: false });
            }
            if (url === '/api/question/200') {
                return Promise.resolve({ question_id: 200, judge_id: 1 });
            }
        });

        await handleSendGuessToAnswer(mockSocket, data);

        expect(saveGuessToDatabase).toHaveBeenCalledWith({
            questionId: 200,
            confidence: 5,
            result: true, // !is_pretender (false) -> true
            judgeId: 1,
            answerId: 100,
            argument: 'I think so',
        });
    });

    it('should return early if missing fields', async () => {
        await handleSendGuessToAnswer(mockSocket, { confidence: 5 });
        expect(dbClient).not.toHaveBeenCalled();
    });

    it('should return early if answer not found', async () => {
        dbClient.mockResolvedValue(null);
        await handleSendGuessToAnswer(mockSocket, { confidence: 5, answerId: 999, argument: 'X' });
        expect(saveGuessToDatabase).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
        dbClient.mockRejectedValue(new Error('DB fail'));
        await handleSendGuessToAnswer(mockSocket, { confidence: 5, answerId: 100, argument: 'X' });
        // Should not throw, but log error (which we mocked)
    });
});
