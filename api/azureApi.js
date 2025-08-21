const azureService = require('../services/azureService');
const messageKeys = require('../utils/message-keys');

exports.testAIPrompt = async (req, res) => {
    try {
        const response = await azureService.testAIPrompt(req, res);
        res.json(response);
    } catch (error) {
        console.error(`Error POST /testAIPrompt ${error} USER ${req.user.eppn}`);
        res.status(500);
        return res.json([
            {
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_TEST_AI_PROMPT,
            },
        ]);
    }
};
