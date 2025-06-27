const userApi = require('../api/userApi');
exports.admin = (router) => {
    router.get('/user', userApi.getLoggedUser);
};
