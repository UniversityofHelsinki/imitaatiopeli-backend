require('dotenv').config();

const dbApi = require('../api/dbApi');

module.exports = function (router) {
    router.get('/hello', dbApi.getHelloFromDb);
};
