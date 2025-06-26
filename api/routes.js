require('dotenv').config();

const dbApi = require('../api/dbApi');
const userApi = require('./userApi');

module.exports = function (router) {
    router.get('/hello', dbApi.getHelloFromDb);
    router.get('/user', userApi.getLoggedUser);
    router.get('/getPlayerById/:playerId', dbApi.getPlayerById);
    router.post('/savePlayer', dbApi.savePlayer);
};
