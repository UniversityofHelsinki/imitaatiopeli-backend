const dbApi = require('../api/dbApi');
const userApi = require('../api/userApi');
const { dbClient } = require('../services/dbService');
const dbService = require('../services/dbService');
exports.player = (router) => {
    router.get('/hello', dbApi.getHelloFromDb);
    router.get('/getPlayerById/:playerId', dbApi.getPlayerById);
    router.post('/savePlayer', dbApi.savePlayer);
    router.get('/judge/summary/:judgeId/:gameId', dbApi.getJudgeSummary);
    router.post('/judge/finalGuess', dbApi.saveJudgeFinalGuess);
    router.get('/judge/finalGuessRes/:judgeId/:gameId', dbApi.getFinalGuessRes);

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

    router.get('/games/:id/player/:playerId/unansweredQuestion', async (req, res) => {
        const { id, playerId } = req.params;
        const response = await dbClient(`/api/game/${id}/player/${playerId}/unansweredQuestion`);
        if (response) {
            res.status(200).json(response);
        }
        res.status(500).end();
    });

    router.get('/games/:id/player/:playerId/answersForRatingForm', async (req, res) => {
        const { id, playerId } = req.params;
        const response = await dbClient(`/api/game/${id}/player/${playerId}/answersForRatingForm`);
        if (response) {
            res.status(200).json(response);
        }
        res.status(500).end();
    });

    router.get('/games/:id/player/:playerId/notAnswersForRatingForm', async (req, res) => {
        const { id, playerId } = req.params;
        const response = await dbClient(
            `/api/game/${id}/player/${playerId}/notAnswersForRatingForm`,
        );
        if (response) {
            res.status(200).json(response);
        }
        res.status(500).end();
    });

    router.get('/judge/status', async (req, res) => {
        const player = await dbService.getPlayerById(req.headers['x-player-id']);
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const playerStatus = await dbService.getJudgeStatus(player.player_id, player.gameId);
        return res.json(playerStatus).end();
    });

    router.get('/answerer/status', async (req, res) => {
        const player = await dbService.getPlayerById(req.headers['x-player-id']);
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const playerStatus = await dbService.getAnswererStatus(player.player_id, player.gameId);
        return res.json(playerStatus).end();
    });

    router.get('/judge/ready-for-final-review', async (req, res) => {
        const player = await dbService.getPlayerById(req.headers['x-player-id']);
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const response = await dbService.playerReadyForFinalReview(player.player_id, player.gameId);
        return res.json(response).end();
    });
};
