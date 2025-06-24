require('dotenv').config();

const dbApi = require('../api/dbApi');

module.exports = function (router) {
    router.get('/hello', dbApi.getHelloFromDb);
    router.get('/getPlayerById/:playerId', dbApi.getPlayerById);
    router.post('/savePlayer', dbApi.savePlayer);
};
