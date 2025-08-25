const userApi = require('../api/userApi');
const { dbClient } = require('../services/dbService');
const { azureClient } = require('../services/azureService');
const azureApi = require('../api/azureApi');
exports.admin = (router) => {
    router.get('/user', userApi.getLoggedUser);

    router.get('/game/:id', async (req, res) => {
        const { id } = req.params;
        const game = await dbClient(`/api/game/${id}`);
        return res.json(game).end();
    });

    router.post('/game/create', async (req, res) => {
        const { body } = req;

        try {
            const response = await dbClient('/api/game/create', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return res.json(response);
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });

    router.delete('/game/deleteGame', async (req, res) => {
        const { body } = req;

        try {
            const response = await dbClient('/api/game/deleteGame', {
                method: 'DELETE',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return res.json(response);
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });

    router.put('/game/edit', async (req, res) => {
        const { body } = req;
        try {
            const response = await dbClient('/api/game/edit', {
                method: 'put',
                body: JSON.stringify(body),
                headers: {
                    'content-type': 'application/json',
                },
            });
            return res.json(response);
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });

    router.get('/games', async (req, res) => {
        const { user } = req.params;
        try {
            const response = await dbClient('/api/games');
            return res.json(response);
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });

    router.put('/game/:id/start', async (req, res) => {
        const { id } = req.params;
        try {
            await dbClient(`/api/game/${id}/start`, {
                method: 'put',
            });
            return res.status(200).end();
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });

    router.put('/game/:id/end', async (req, res) => {
        const { id } = req.params;
        try {
            await dbClient(`/api/game/${id}/end`, {
                method: 'put',
            });
            return res.status(200).end();
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });


    router.get('/games/:id/lobby', async (req, res) => {
        const { id } = req.params;

        try {
            const game = await dbClient(`/api/games/${id}/lobby`);
            return res.json(game);
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });

    router.get('/games/:id/players', async (req, res) => {
        const { id } = req.params;
        try {
            const players = await dbClient(`/api/games/${id}/players`);
            res.json(players);
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });


    router.post('/testAIPrompt', azureApi.testAIPrompt);
};
