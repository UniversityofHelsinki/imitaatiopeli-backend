const dbService = require('../services/dbService');

exports.getHelloFromDb = async (req, res) => {
    try {
        const response = await dbService.getHelloFromBackend();
        res.json(response);
    } catch (err) {
        res.status(500);
    }
};
