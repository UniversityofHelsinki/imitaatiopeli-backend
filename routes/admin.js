const userApi = require('../api/userApi');
const { dbClient } = require('../services/dbService');
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
};
