const { testAIPrompt } = require('../api/azureApi.js');
const azureService = require('../services/azureService.js');
const messageKeys = require('../utils/message-keys.js');

// Mock the azureService
jest.mock('../services/azureService.js');

describe('azureApi - testAIPrompt', () => {
    let req, res;

    beforeEach(() => {
        // Mock request object
        req = {
            body: {
                prompt: 'You are a helpful assistant',
                question: 'What is JavaScript?',
            },
            user: {
                eppn: 'testuser@example.com',
            },
        };

        // Mock response object
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Successful scenarios', () => {
        test('should return successful response when azureService succeeds', async () => {
            const mockAzureResponse = {
                success: true,
                answer: 'JavaScript is a programming language...',
                metadata: { tokens: 150 },
            };

            azureService.testAIPrompt.mockResolvedValue(mockAzureResponse);

            await testAIPrompt(req, res);

            expect(azureService.testAIPrompt).toHaveBeenCalledWith(req, res);
            expect(res.json).toHaveBeenCalledWith(mockAzureResponse);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('Error scenarios', () => {
        test('should handle azureService errors and return 500', async () => {
            const mockError = new Error('Azure service unavailable');
            azureService.testAIPrompt.mockRejectedValue(mockError);

            // Spy on console.error to verify logging
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await testAIPrompt(req, res);

            expect(consoleSpy).toHaveBeenCalledWith(
                `Error POST /testAIPrompt ${mockError} USER ${req.user.eppn}`,
            );
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith([
                {
                    message: messageKeys.ERROR_MESSAGE_FAILED_TO_TEST_AI_PROMPT,
                },
            ]);

            consoleSpy.mockRestore();
        });

        test('should handle network errors', async () => {
            const networkError = new Error('Network timeout');
            azureService.testAIPrompt.mockRejectedValue(networkError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await testAIPrompt(req, res);

            expect(consoleSpy).toHaveBeenCalledWith(
                `Error POST /testAIPrompt ${networkError} USER ${req.user.eppn}`,
            );
            expect(res.status).toHaveBeenCalledWith(500);

            consoleSpy.mockRestore();
        });

        test('should handle missing user information gracefully', async () => {
            req.user = { eppn: undefined }; // Missing eppn
            const mockError = new Error('Service error');
            azureService.testAIPrompt.mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await testAIPrompt(req, res);

            expect(consoleSpy).toHaveBeenCalledWith(
                `Error POST /testAIPrompt ${mockError} USER undefined`,
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Edge cases', () => {
        test('should handle empty response from azureService', async () => {
            azureService.testAIPrompt.mockResolvedValue(null);

            await testAIPrompt(req, res);

            expect(res.json).toHaveBeenCalledWith(null);
        });

        test('should handle undefined response from azureService', async () => {
            azureService.testAIPrompt.mockResolvedValue(undefined);

            await testAIPrompt(req, res);

            expect(res.json).toHaveBeenCalledWith(undefined);
        });
    });
});
