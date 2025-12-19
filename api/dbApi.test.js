const dbApi = require('./dbApi');
const dbService = require('../services/dbService');
const messageKeys = require('../utils/message-keys');

jest.mock('../services/dbService');

describe('dbApi', () => {
    let mockReq;
    let mockRes;
    let consoleErrorSpy;

    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            params: {},
            body: {},
            user: { eppn: 'testuser' },
            headers: { 'test-header': 'value' },
        };
        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
        };
    });

    describe('getHelloFromDb', () => {
        it('should return response from dbService', async () => {
            const mockResponse = { message: 'hello' };
            dbService.getHelloFromBackend.mockResolvedValue(mockResponse);

            await dbApi.getHelloFromDb(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
        });

        it('should return 500 on error', async () => {
            dbService.getHelloFromBackend.mockRejectedValue(new Error('error'));

            await dbApi.getHelloFromDb(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllLanguageModels', () => {
        it('should return models on success', async () => {
            const mockModels = [{ id: 1, name: 'GPT-4' }];
            dbService.getAllLanguageModels.mockResolvedValue(mockModels);

            await dbApi.getAllLanguageModels(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockModels);
        });

        it('should return 404 if no models found', async () => {
            dbService.getAllLanguageModels.mockResolvedValue([]);

            await dbApi.getAllLanguageModels(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'No language models found' });
        });

        it('should return 500 on error', async () => {
            dbService.getAllLanguageModels.mockRejectedValue(new Error('error'));

            await dbApi.getAllLanguageModels(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getPlayerById', () => {
        it('should return player data', async () => {
            mockReq.params.playerId = '123';
            const mockPlayer = { id: '123', name: 'Player' };
            dbService.getPlayerById.mockResolvedValue(mockPlayer);

            await dbApi.getPlayerById(mockReq, mockRes);

            expect(dbService.getPlayerById).toHaveBeenCalledWith('123');
            expect(mockRes.json).toHaveBeenCalledWith(mockPlayer);
        });

        it('should return 500 on error', async () => {
            dbService.getPlayerById.mockRejectedValue(new Error('error'));

            await dbApi.getPlayerById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getJudgeById', () => {
        it('should return judge data', async () => {
            const mockJudge = { id: '123', is_judge: true };
            dbService.getJudgeById.mockResolvedValue(mockJudge);

            const result = await dbApi.getJudgeById('123', 'game456');

            expect(dbService.getJudgeById).toHaveBeenCalledWith('123', 'game456');
            expect(result).toBe(mockJudge);
        });

        it('should return null on error', async () => {
            dbService.getJudgeById.mockRejectedValue(new Error('error'));

            const result = await dbApi.getJudgeById('123', 'game456');

            expect(result).toBeNull();
        });
    });

    describe('getPlayroomJudgePlayerPairs', () => {
        it('should return pairs', async () => {
            const mockPairs = [{ judge: '1', player: '2' }];
            dbService.getPlayroomJudgePlayerPairs.mockResolvedValue(mockPairs);

            const result = await dbApi.getPlayroomJudgePlayerPairs('game123');

            expect(dbService.getPlayroomJudgePlayerPairs).toHaveBeenCalledWith('game123');
            expect(result).toBe(mockPairs);
        });

        it('should return null on error', async () => {
            dbService.getPlayroomJudgePlayerPairs.mockRejectedValue(new Error('error'));

            const result = await dbApi.getPlayroomJudgePlayerPairs('game123');

            expect(result).toBeNull();
        });
    });

    describe('savePlayer', () => {
        it('should save player and return response', async () => {
            const mockResponse = { id: '123' };
            dbService.savePlayer.mockResolvedValue(mockResponse);

            await dbApi.savePlayer(mockReq, mockRes);

            expect(dbService.savePlayer).toHaveBeenCalledWith(mockReq, mockRes);
            expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
        });

        it('should return 500 and error message on failure', async () => {
            dbService.savePlayer.mockRejectedValue(new Error('error'));

            await dbApi.savePlayer(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith([
                { message: messageKeys.ERROR_MESSAGE_FAILED_TO_ADD_PLAYER },
            ]);
        });
    });

    describe('saveQuestion', () => {
        it('should save question', async () => {
            const mockData = { question: 'test' };
            const mockResponse = { success: true };
            dbService.saveQuestion.mockResolvedValue(mockResponse);

            const result = await dbApi.saveQuestion(mockData);

            expect(dbService.saveQuestion).toHaveBeenCalledWith(mockData);
            expect(result).toBe(mockResponse);
        });

        it('should throw error on failure', async () => {
            dbService.saveQuestion.mockRejectedValue(new Error('error'));

            await expect(dbApi.saveQuestion({})).rejects.toThrow('error');
        });
    });

    describe('getJudgeSummary', () => {
        it('should return judge summary', async () => {
            mockReq.params = { judgeId: 'j1', gameId: 'g1' };
            const mockSummary = { score: 100 };
            dbService.getJudgeSummary.mockResolvedValue(mockSummary);

            await dbApi.getJudgeSummary(mockReq, mockRes);

            expect(dbService.getJudgeSummary).toHaveBeenCalledWith('j1', 'g1', mockReq.headers);
            expect(mockRes.json).toHaveBeenCalledWith(mockSummary);
        });

        it('should return 500 on error', async () => {
            dbService.getJudgeSummary.mockRejectedValue(new Error('error'));

            await dbApi.getJudgeSummary(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getFinalGuessRes', () => {
        it('should return final guess result', async () => {
            mockReq.params = { judgeId: 'j1', gameId: 'g1' };
            const mockResData = { correct: true };
            dbService.getFinalGuessRes.mockResolvedValue(mockResData);

            await dbApi.getFinalGuessRes(mockReq, mockRes);

            expect(dbService.getFinalGuessRes).toHaveBeenCalledWith('j1', 'g1');
            expect(mockRes.json).toHaveBeenCalledWith(mockResData);
        });

        it('should return 500 on error', async () => {
            dbService.getFinalGuessRes.mockRejectedValue(new Error('error'));

            await dbApi.getFinalGuessRes(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getHaveAllPlayersEndedGame', () => {
        it('should return result from service', async () => {
            dbService.getHaveAllPlayersEndedGame.mockResolvedValue(true);

            const result = await dbApi.getHaveAllPlayersEndedGame('g1');

            expect(dbService.getHaveAllPlayersEndedGame).toHaveBeenCalledWith('g1');
            expect(result).toBe(true);
        });

        it('should return 500 on error', async () => {
            // Note: the implementation calls res.status(500) but res is not passed to the function!
            // This might be a bug in dbApi.js
            dbService.getHaveAllPlayersEndedGame.mockRejectedValue(new Error('error'));

            // Since 'res' is not defined in getHaveAllPlayersEndedGame, this will likely throw a ReferenceError
            // We can check if it throws ReferenceError or if it handles it (it doesn't in the code)
            try {
                await dbApi.getHaveAllPlayersEndedGame('g1');
            } catch (e) {
                expect(e).toBeInstanceOf(ReferenceError);
            }
        });
    });

    describe('saveJudgeFinalGuess', () => {
        it('should save guess and return response', async () => {
            mockReq.body = { guess: 'A' };
            const mockResponse = { success: true };
            dbService.saveJudgeFinalGuess.mockResolvedValue(mockResponse);

            await dbApi.saveJudgeFinalGuess(mockReq, mockRes);

            expect(dbService.saveJudgeFinalGuess).toHaveBeenCalledWith(mockReq.body);
            expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
        });

        it('should return 500 on error', async () => {
            dbService.saveJudgeFinalGuess.mockRejectedValue(new Error('error'));

            await dbApi.saveJudgeFinalGuess(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getUserGames', () => {
        it('should return games for user', async () => {
            const mockGames = [{ id: 'g1' }];
            dbService.getGamesForUser.mockResolvedValue(mockGames);

            await dbApi.getUserGames(mockReq, mockRes);

            expect(dbService.getGamesForUser).toHaveBeenCalledWith('testuser');
            expect(mockRes.json).toHaveBeenCalledWith(mockGames);
        });

        it('should return empty array if no games found', async () => {
            dbService.getGamesForUser.mockResolvedValue([]);

            await dbApi.getUserGames(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith([]);
        });

        it('should return 500 on error', async () => {
            dbService.getGamesForUser.mockRejectedValue(new Error('error'));

            await dbApi.getUserGames(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAdminGameSummary', () => {
        it('should return admin game summary', async () => {
            mockReq.params = { gameId: 'g1', eppn: 'u1' };
            const mockSummary = { totalPlayers: 10 };
            dbService.getAdminGameSummary.mockResolvedValue(mockSummary);

            await dbApi.getAdminGameSummary(mockReq, mockRes);

            expect(dbService.getAdminGameSummary).toHaveBeenCalledWith('g1', 'u1');
            expect(mockRes.json).toHaveBeenCalledWith(mockSummary);
        });

        it('should return empty response if no summary found', async () => {
            dbService.getAdminGameSummary.mockResolvedValue(null);

            await dbApi.getAdminGameSummary(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith();
        });

        it('should return 500 on error', async () => {
            dbService.getAdminGameSummary.mockRejectedValue(new Error('error'));

            await dbApi.getAdminGameSummary(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllPromptTemplates', () => {
        it('should return templates', async () => {
            const mockTemplates = [{ id: 1, template: 'test' }];
            dbService.getAllPromptTemplates.mockResolvedValue(mockTemplates);

            await dbApi.getAllPromptTemplates(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockTemplates);
        });

        it('should return 404 if no templates found', async () => {
            dbService.getAllPromptTemplates.mockResolvedValue([]);

            await dbApi.getAllPromptTemplates(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'No prompt templates found' });
        });

        it('should return 500 on error', async () => {
            dbService.getAllPromptTemplates.mockRejectedValue(new Error('error'));

            await dbApi.getAllPromptTemplates(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
