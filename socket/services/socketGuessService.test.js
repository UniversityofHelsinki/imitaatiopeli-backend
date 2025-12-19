const { saveGuessToDatabase } = require('./socketGuessService');
const { dbClient } = require('../../services/dbService');

jest.mock('../../services/dbService');
jest.mock('../../logger');

describe('socketGuessService', () => {
    it('should call dbClient with correct parameters', async () => {
        const data = { questionId: 1, confidence: 5, result: true };
        dbClient.mockResolvedValue({ id: 100 });

        const result = await saveGuessToDatabase(data);

        expect(dbClient).toHaveBeenCalledWith('/api/guess/save', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        expect(result).toEqual({ id: 100 });
    });

    it('should throw error on database failure', async () => {
        dbClient.mockRejectedValue(new Error('DB error'));

        await expect(saveGuessToDatabase({})).rejects.toThrow('Failed to save guess to database');
    });
});
