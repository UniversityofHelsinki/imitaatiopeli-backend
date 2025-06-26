const userService = require('../services/userService');
exports.getLoggedUser = (req, res) => {
    res.json(userService.getLoggedUser(req.user));
};
