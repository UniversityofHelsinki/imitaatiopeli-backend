const dbApi = require('../api/dbApi');
const userApi = require('../api/userApi');
const { dbClient } = require('../services/dbService');
exports.player = (router) => {
    router.get('/hello', dbApi.getHelloFromDb);
    router.get('/getPlayerById/:playerId', dbApi.getPlayerById);
    router.post('/savePlayer', dbApi.savePlayer);

    router.get('/games/:code', async (req, res) => {
        const { code } = req.params;
        const response = await dbClient(`/api/game/code/${code}`);
        if (response) {
            res.json(response);
        }
        res.status(500).end();
    });

    router.get('/game/:id', async (req, res) => {
        const { id } = req.params;
        const game = await dbClient(`/api/game/${id}`);
        return res.json(game).end();
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

    router.post('/games/join', async (req, res) => {
        const { body } = req;

        const response = await dbClient(`/api/game/join`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response) {
            res.status(200).json(response);
        }
        res.status(500).end();
    });

    router.post('/games/answer', async (req, res) => {
        const { body } = req;

        const response = await dbClient(`/api/game/answer`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response) {
            res.status(200).json(response);
        }
        res.status(500).end();
    });
};
