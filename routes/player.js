const dbApi = require('../api/dbApi');
const userApi = require('../api/userApi');
exports.player = (router) => {
    router.get('/hello', dbApi.getHelloFromDb);
    router.get('/getPlayerById/:playerId', dbApi.getPlayerById);
    router.post('/savePlayer', dbApi.savePlayer);
};
