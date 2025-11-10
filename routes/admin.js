const userApi = require('../api/userApi');
const { dbClient } = require('../services/dbService');
const { azureClient } = require('../services/azureService');
const azureApi = require('../api/azureApi');
const dbApi = require('../api/dbApi');
const ExcelJS = require('exceljs');

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

    router.get('/games/:id/judgeplayerpairs', async (req, res) => {
        const { id } = req.params;
        try {
            const players = await dbClient(`/api/games/${id}/judgeplayerpairs`);
            res.json(players);
        } catch (error) {
            return res.status(500).json(error.message);
        }
    });

    router.post('/testAIPrompt', azureApi.testAIPrompt);

    router.get('/languageModels', dbApi.getAllLanguageModels);

    router.get('/games/:id/gameDataToExcel', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await dbClient(`/api/game/${id}/gameDataToExcel`);

            if (!result || result.length === 0) {
                return res.status(404).json({ error: 'No data found' });
            }

            // Create workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Game Data');

            // Define columns
            worksheet.columns = [
                { header: 'Player', key: 'player', width: 10 },
                { header: 'Sequence', key: 'sequence', width: 10 },
                { header: 'Question', key: 'question', width: 40 },
                { header: 'Pretender', key: 'pretender', width: 40 },
                { header: 'Non-pretender', key: 'non_pretender', width: 40 },
                { header: 'Assessment', key: 'assessment', width: 40 },
                { header: 'Correct', key: 'correct', width: 10 },
                { header: 'Confidence', key: 'confidence', width: 12 },
                { header: 'Final Assessment', key: 'final_assessment', width: 40 },
                { header: 'Final Correct', key: 'final_correct', width: 12 },
                { header: 'Final Confidence', key: 'final_confidence', width: 15 },
            ];

            // Add data rows
            result.forEach((row) => {
                worksheet.addRow({
                    player: row.player,
                    sequence: row.sequence === 999 ? 'Final' : row.sequence,
                    question: row.question,
                    pretender: row.pretender,
                    non_pretender: row.non_pretender,
                    assessment: row.assessment,
                    correct: row.correct,
                    confidence: row.confidence,
                    final_assessment: row.final_assessment,
                    final_correct: row.final_correct,
                    final_confidence: row.final_confidence,
                });
            });

            // Style the header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' },
            };

            // Set response headers for download
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            res.setHeader('Content-Disposition', `attachment; filename=game_${id}_data.xlsx`);

            // Write to response and end
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('Error generating Excel:', error);
            return res.status(500).json({ error: error.message });
        }
    });
};
