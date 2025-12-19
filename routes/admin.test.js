const { admin } = require('./admin');
const { dbClient } = require('../services/dbService');
const { createWorkbookFromGameData, setExcelDownloadHeaders } = require('../services/excelService');
const userApi = require('../api/userApi');
const azureApi = require('../api/azureApi');
const dbApi = require('../api/dbApi');

jest.mock('../services/dbService');
jest.mock('../services/azureService');
jest.mock('../services/excelService');
jest.mock('../api/userApi');
jest.mock('../api/azureApi');
jest.mock('../api/dbApi');

// Mock crypto.randomUUID()
global.crypto = {
    randomUUID: jest.fn().mockReturnValue('mocked-uuid'),
};

describe('admin routes', () => {
    let routes = {};
    const mockRouter = {
        get: jest.fn((path, handler) => {
            routes[`GET ${path}`] = handler;
        }),
        post: jest.fn((path, handler) => {
            routes[`POST ${path}`] = handler;
        }),
        put: jest.fn((path, handler) => {
            routes[`PUT ${path}`] = handler;
        }),
        delete: jest.fn((path, handler) => {
            routes[`DELETE ${path}`] = handler;
        }),
    };

    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        admin(mockRouter);
        req = {
            params: {},
            body: {},
            user: { eppn: 'test-user' },
        };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
        };
    });

    test('GET /user calls userApi.getLoggedUser', async () => {
        const handler = routes['GET /user'];
        await handler(req, res);
        expect(userApi.getLoggedUser).toHaveBeenCalledWith(req, res);
    });

    test('GET /game/:id success', async () => {
        const handler = routes['GET /game/:id'];
        req.params.id = '123';
        dbClient.mockResolvedValue({ id: '123', name: 'Test Game' });

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/game/123');
        expect(res.json).toHaveBeenCalledWith({ id: '123', name: 'Test Game' });
        expect(res.end).toHaveBeenCalled();
    });

    test('POST /game/create success', async () => {
        const handler = routes['POST /game/create'];
        req.body.configuration = { some: 'config' };
        dbClient.mockResolvedValue({ success: true });

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/game/create', {
            method: 'POST',
            body: JSON.stringify({
                configuration: { some: 'config' },
                gameCode: 'mocked-uuid',
                userId: 'test-user',
            }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('POST /game/create failure', async () => {
        const handler = routes['POST /game/create'];
        dbClient.mockRejectedValue(new Error('Creation failed'));

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith('Creation failed');
    });

    test('DELETE /game/deleteGame success', async () => {
        const handler = routes['DELETE /game/deleteGame'];
        req.body = { gameId: '123' };
        dbClient.mockResolvedValue({ success: true });

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/game/deleteGame', {
            method: 'DELETE',
            body: JSON.stringify({ gameId: '123' }),
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('PUT /game/edit success', async () => {
        const handler = routes['PUT /game/edit'];
        req.body = { game_id: '123', some: 'edit' };
        dbClient.mockResolvedValueOnce(0); // playerCount
        dbClient.mockResolvedValueOnce({ success: true }); // edit response

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/game/playercount/123');
        expect(dbClient).toHaveBeenCalledWith('/api/game/edit', expect.any(Object));
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('PUT /game/edit error if gameId missing', async () => {
        const handler = routes['PUT /game/edit'];
        req.body = {};

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'gameId is required in request body' });
    });

    test('PUT /game/edit error if players already joined', async () => {
        const handler = routes['PUT /game/edit'];
        req.body = { game_id: '123' };
        dbClient.mockResolvedValueOnce(5); // playerCount > 0

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'edit_game_form_error_notification' });
    });

    test('PUT /game/:id/start success', async () => {
        const handler = routes['PUT /game/:id/start'];
        req.params.id = '123';
        dbClient.mockResolvedValue({});

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/game/123/start', { method: 'put' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.end).toHaveBeenCalled();
    });

    test('PUT /game/:id/end success', async () => {
        const handler = routes['PUT /game/:id/end'];
        req.params.id = '123';
        dbClient.mockResolvedValue({});

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/game/123/end', { method: 'put' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.end).toHaveBeenCalled();
    });

    test('GET /games/:id/lobby success', async () => {
        const handler = routes['GET /games/:id/lobby'];
        req.params.id = '123';
        dbClient.mockResolvedValue({ status: 'lobby' });

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/games/123/lobby');
        expect(res.json).toHaveBeenCalledWith({ status: 'lobby' });
    });

    test('GET /games/:id/players success', async () => {
        const handler = routes['GET /games/:id/players'];
        req.params.id = '123';
        dbClient.mockResolvedValue([{ name: 'P1' }]);

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/games/123/players');
        expect(res.json).toHaveBeenCalledWith([{ name: 'P1' }]);
    });

    test('GET /games/:id/judgeplayerpairs success', async () => {
        const handler = routes['GET /games/:id/judgeplayerpairs'];
        req.params.id = '123';
        dbClient.mockResolvedValue([{ judge: 'J1', player: 'P1' }]);

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/games/123/judgeplayerpairs');
        expect(res.json).toHaveBeenCalledWith([{ judge: 'J1', player: 'P1' }]);
    });

    test('POST /testAIPrompt calls azureApi.testAIPrompt', async () => {
        const handler = routes['POST /testAIPrompt'];
        await handler(req, res);
        expect(azureApi.testAIPrompt).toHaveBeenCalledWith(req, res);
    });

    test('GET /languageModels calls dbApi.getAllLanguageModels', async () => {
        const handler = routes['GET /languageModels'];
        await handler(req, res);
        expect(dbApi.getAllLanguageModels).toHaveBeenCalledWith(req, res);
    });

    test('GET /game/:id/getPlayroomJudgePlayerPairs success', async () => {
        const handler = routes['GET /game/:id/getPlayroomJudgePlayerPairs'];
        req.params.id = '123';
        const mockPairs = [{ p: 1 }];
        dbApi.getPlayroomJudgePlayerPairs.mockResolvedValue(mockPairs);
        dbApi.getHaveAllPlayersEndedGame.mockResolvedValue(true);

        await handler(req, res);

        expect(dbApi.getPlayroomJudgePlayerPairs).toHaveBeenCalledWith('123');
        expect(dbApi.getHaveAllPlayersEndedGame).toHaveBeenCalledWith('123');
        expect(res.json).toHaveBeenCalledWith([...mockPairs, true]);
    });

    test('GET /games/:id/gameDataToExcel success', async () => {
        const handler = routes['GET /games/:id/gameDataToExcel'];
        req.params.id = '123';
        const mockData = { gameData: [] };
        dbClient.mockResolvedValue(mockData);
        const mockWorkbook = {
            xlsx: {
                write: jest.fn().mockResolvedValue(),
            },
        };
        createWorkbookFromGameData.mockReturnValue(mockWorkbook);

        await handler(req, res);

        expect(dbClient).toHaveBeenCalledWith('/api/game/123/gameDataToExcel');
        expect(createWorkbookFromGameData).toHaveBeenCalledWith(mockData);
        expect(setExcelDownloadHeaders).toHaveBeenCalledWith(res, '123');
        expect(mockWorkbook.xlsx.write).toHaveBeenCalledWith(res);
        expect(res.end).toHaveBeenCalled();
    });

    test('GET /games/:id/gameDataToExcel 404 when no data', async () => {
        const handler = routes['GET /games/:id/gameDataToExcel'];
        req.params.id = '123';
        dbClient.mockResolvedValue(null);

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'No data found' });
    });

    test('GET /games calls dbApi.getUserGames', async () => {
        const handler = routes['GET /games'];
        await handler(req, res);
        expect(dbApi.getUserGames).toHaveBeenCalledWith(req, res);
    });

    test('GET /games/:gameId/summary calls dbApi.getAdminGameSummary', async () => {
        const handler = routes['GET /games/:gameId/summary'];
        req.params.gameId = '123';
        req.user.eppn = 'test-user';

        await handler(req, res);

        expect(dbApi.getAdminGameSummary).toHaveBeenCalledWith(
            expect.objectContaining({
                params: { gameId: '123', eppn: 'test-user' },
            }),
            res,
        );
    });

    test('GET /promptTemplates calls dbApi.getAllPromptTemplates', async () => {
        const handler = routes['GET /promptTemplates'];
        await handler(req, res);
        expect(dbApi.getAllPromptTemplates).toHaveBeenCalledWith(req, res);
    });
});
