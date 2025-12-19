const dbService = require('./dbService');

jest.mock('./dbService');

describe('azureService', () => {
    let azureService;
    const originalFetch = global.fetch;

    beforeEach(() => {
        process.env.AZURE_SERVICE_HOST = 'http://azure-host';
        azureService = require('./azureService');
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    describe('getAIContextualAnswer', () => {
        it('should call azureClient with correct parameters', async () => {
            const mockResponse = { answer: 'AI Answer' };
            global.fetch.mockResolvedValue({
                ok: true,
                headers: { get: () => 'application/json' },
                json: async () => mockResponse,
            });

            const result = await azureService.getAIContextualAnswer(
                'prompt',
                0.7,
                'model1',
                'player answer',
                'message body',
                'http://model-url',
            );

            expect(global.fetch).toHaveBeenCalledWith(
                'http://azure-host/api/askWithContext',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        messageBody: 'message body',
                        prompt: 'prompt',
                        temperature: 0.7,
                        languageModelUrl: 'http://model-url',
                    }),
                }),
            );
            expect(result).toEqual(mockResponse);
        });

        it('should throw error if required parameters are missing', async () => {
            await expect(
                azureService.getAIContextualAnswer(
                    null,
                    0.7,
                    'model1',
                    'player answer',
                    'message body',
                ),
            ).rejects.toThrow('Prompt, message body and temperature are required');
        });
    });

    describe('getAIAnswer', () => {
        it('should call azureClient with correct parameters', async () => {
            const mockResponse = { answer: 'AI Answer' };
            global.fetch.mockResolvedValue({
                ok: true,
                headers: { get: () => 'application/json' },
                json: async () => mockResponse,
            });

            const result = await azureService.getAIAnswer(
                'prompt',
                0.7,
                'model1',
                'player answer',
                'question',
                'http://model-url',
            );

            expect(global.fetch).toHaveBeenCalledWith(
                'http://azure-host/api/ask',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        question: 'question',
                        prompt: 'prompt',
                        temperature: 0.7,
                        languageModelUrl: 'http://model-url',
                    }),
                }),
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('testAIPrompt', () => {
        it('should fetch language model and call azureClient', async () => {
            const mockReq = {
                body: {
                    prompt: 'test prompt',
                    question: 'test question',
                    temperature: 0.5,
                    languageModelId: 'model123',
                },
            };

            dbService.getLanguageModelById.mockResolvedValue({ url: 'http://model-url' });

            global.fetch.mockResolvedValue({
                ok: true,
                headers: { get: () => 'application/json' },
                json: async () => ({ result: 'ok' }),
            });

            const result = await azureService.testAIPrompt(mockReq);

            expect(dbService.getLanguageModelById).toHaveBeenCalledWith('model123');
            expect(global.fetch).toHaveBeenCalledWith(
                'http://azure-host/api/ask',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        question: 'test question',
                        prompt: 'test prompt',
                        temperature: 0.5,
                        languageModelUrl: 'http://model-url',
                    }),
                }),
            );
            expect(result).toEqual({ result: 'ok' });
        });
    });
});
