const dbService = require('./dbService');

describe('dbService', () => {
    const originalFetch = global.fetch;
    let dbServiceWithEnv;

    beforeEach(() => {
        jest.resetModules();
        process.env.DB_HOST = 'http://db-host';
        dbServiceWithEnv = require('./dbService');
        global.fetch = jest.fn();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    const mockJsonResponse = (data) => {
        global.fetch.mockResolvedValue({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => data,
        });
    };

    describe('dbClient', () => {
        it('should call fetch with correct URL and options', async () => {
            mockJsonResponse({ result: 'ok' });
            const result = await dbServiceWithEnv.dbClient('/test-path', { method: 'POST' });
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/test-path', {
                method: 'POST',
            });
            expect(result).toEqual({ result: 'ok' });
        });

        it('should throw error if response is not ok', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
                url: 'http://db-host/test-path',
            });
            await expect(dbServiceWithEnv.dbClient('/test-path')).rejects.toThrow(
                'Unexpected status code 500 from http://db-host/test-path',
            );
        });
    });

    describe('savePlayer', () => {
        it('should call dbClient with POST and body', async () => {
            mockJsonResponse({ id: 1 });
            const req = { body: { name: 'Player1' } };
            const result = await dbServiceWithEnv.savePlayer(req);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://db-host/api/savePlayer',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(req.body),
                }),
            );
            expect(result).toEqual({ id: 1 });
        });
    });

    describe('getPlayerById', () => {
        it('should call dbClient with correct URL', async () => {
            mockJsonResponse({ id: 'p1' });
            await dbServiceWithEnv.getPlayerById('p1');
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/getPlayerById/p1', {
                method: 'GET',
            });
        });
    });

    describe('saveJudgeFinalGuess', () => {
        it('should flip is_pretender and call dbClient', async () => {
            mockJsonResponse({ success: true });
            const data = { judgeId: 'j1', is_pretender: true };
            await dbServiceWithEnv.saveJudgeFinalGuess(data);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://db-host/api/judge/finalGuess',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ judgeId: 'j1', is_pretender: false }),
                }),
            );
        });

        it('should flip is_pretender from false to true', async () => {
            mockJsonResponse({ success: true });
            const data = { judgeId: 'j1', is_pretender: false };
            await dbServiceWithEnv.saveJudgeFinalGuess(data);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://db-host/api/judge/finalGuess',
                expect.objectContaining({
                    body: JSON.stringify({ judgeId: 'j1', is_pretender: true }),
                }),
            );
        });
    });

    describe('other GET methods', () => {
        it('getJudgeById', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getJudgeById('p1', 'g1');
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/getJudgeById/p1/g1', {
                method: 'GET',
            });
        });

        it('getHelloFromBackend', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getHelloFromBackend();
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/hello', {
                method: 'GET',
            });
        });

        it('getAllLanguageModels', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getAllLanguageModels();
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/languageModels', {
                method: 'GET',
            });
        });

        it('getLanguageModelById', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getLanguageModelById('m1');
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/languageModelUrl/m1', {
                method: 'GET',
            });
        });

        it('getPlayroomJudgePlayerPairs', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getPlayroomJudgePlayerPairs('g1');
            expect(global.fetch).toHaveBeenCalledWith(
                'http://db-host/api/games/g1/playroomPlayerPairs',
                { method: 'GET' },
            );
        });

        it('getJudgeSummary', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getJudgeSummary('j1', 'g1');
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/judge/summary/j1/g1', {
                method: 'GET',
            });
        });

        it('getFinalGuessRes', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getFinalGuessRes('j1', 'g1');
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/getFinalGuessRes/j1/g1', {
                method: 'GET',
            });
        });

        it('getHaveAllPlayersEndedGame', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getHaveAllPlayersEndedGame('g1');
            expect(global.fetch).toHaveBeenCalledWith(
                'http://db-host/api/getHaveAllPlayersEndedGame/g1',
                { method: 'GET' },
            );
        });

        it('getGamesForUser', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getGamesForUser('user1');
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/games/user1', {
                method: 'GET',
            });
        });

        it('getAdminGameSummary', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getAdminGameSummary('g1', 'u1');
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/games/g1/u1/summary', {
                method: 'GET',
            });
        });

        it('getAllPromptTemplates', async () => {
            mockJsonResponse({});
            await dbServiceWithEnv.getAllPromptTemplates();
            expect(global.fetch).toHaveBeenCalledWith('http://db-host/api/promptTemplates', {
                method: 'GET',
            });
        });
    });

    describe('saveQuestion', () => {
        it('should call dbClient with POST and question data', async () => {
            mockJsonResponse({});
            const questionData = { question: 'test' };
            await dbServiceWithEnv.saveQuestion(questionData);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://db-host/api/game/saveQuestion',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(questionData),
                }),
            );
        });
    });
});
