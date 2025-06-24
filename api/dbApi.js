const dbService = require('../services/dbService');
const messageKeys = require('../utils/message-keys');

exports.getHelloFromDb = async (req, res) => {
    try {
        const response = await dbService.getHelloFromBackend();
        res.json(response);
    } catch (err) {
        res.status(500);
    }
};

exports.getPlayerById = async (req, res) => {
    try {
        const playerId = req.params.playerId;
        const response = await dbService.getPlayerById(playerId);
        res.json(response);
    } catch (err) {
        res.status(500);
    }
};

exports.savePlayer = async (req, res) => {
    try {
        const response = await dbService.savePlayer(req, res);
        res.json(response);
    } catch (error) {
        console.error(`Error POST /savePlayer ${error} USER ${req.user.eppn}`);
        res.status(500);
        return res.json([
            {
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_ADD_PLAYER,
            },
        ]);
    }
};
