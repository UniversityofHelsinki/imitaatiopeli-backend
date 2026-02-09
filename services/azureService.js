const { getLanguageModelById } = require('./dbService');
const azureServiceHost = process.env.AZURE_SERVICE_HOST;

const azureClient = async (path, options = { method: 'GET' }) => {
    try {
        const url = `${azureServiceHost}${path.indexOf('/') !== 0 ? `/${path}` : path}`;
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`Unexpected status code ${response.status} from ${url}`);
        }

        const contentType = response.headers.get('Content-Type');
        if (contentType?.startsWith('application/json')) {
            return await response.json();
        }

        return await response.text();
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

exports.getAIContextualAnswer = async (
    prompt,
    languageModelId,
    playerAnswer,
    messageBody,
    languageModelUrl,
) => {
    if (!prompt || !messageBody) {
        throw new Error('Prompt and message body are required');
    }

    if (!playerAnswer) {
        throw new Error('Player answer not found');
    }

    if (!languageModelId) {
        throw new Error('Language model is invalid');
    }

    const url = `/api/askWithContext`;
    return await azureClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageBody, prompt, languageModelUrl }),
    });
};

exports.getAIAnswer = async (prompt, languageModelId, playerAnswer, question, languageModelUrl) => {
    if (!prompt || !question) {
        throw new Error('Prompt and question are required');
    }

    if (!playerAnswer) {
        throw new Error('Player answer not found');
    }

    if (!languageModelId) {
        throw new Error('Language model is invalid');
    }

    const url = `/api/ask`;
    return await azureClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, prompt, languageModelUrl }),
    });
};

exports.testAIPrompt = async (req) => {
    const { prompt, question, languageModelId } = req.body;

    if (!prompt || !question) {
        throw new Error('Prompt, question are required');
    }

    if (!languageModelId) {
        throw new Error('Language model is invalid');
    }

    const { url: languageModelUrl } = await getLanguageModelById(languageModelId);

    const url = `/api/ask`;
    return await azureClient(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, prompt, languageModelUrl }),
    });
};
