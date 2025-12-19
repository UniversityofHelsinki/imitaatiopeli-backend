const { handleSendAnswer } = require('./socketAnswerService');
const dbService = require('../../services/dbService');
const azureService = require('../../services/azureService');
const { getJudgeById } = require('../../api/dbApi');

jest.mock('../../services/dbService');
jest.mock('../../services/azureService');
jest.mock('../../api/dbApi');
jest.mock('../../logger');
jest.mock('../handlers/socketGameHandler');

describe('socketAnswerService', () => {
    let mockSocket;
    let mockIo;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSocket = {
            id: 'player-socket-id',
            emit: jest.fn(),
        };
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
        // Mock console.log to keep test output clean
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    const validData = {
        questionId: 100,
        gameId: 10,
        playerId: 1,
        answer: 'This is my answer',
        session_token: 'valid-token',
    };

    describe('handleSendAnswer', () => {
        it('should process answer, get AI answer, and notify judge', async () => {
            // Setup mocks
            dbService.getPlayerById.mockResolvedValue({ session_token: 'valid-token' });
            dbService.dbClient.mockImplementation((url) => {
                if (url === '/api/game/question/100/10')
                    return Promise.resolve({ question_text: 'Q?' });
                if (url === '/api/game/10')
                    return Promise.resolve({
                        configuration: {
                            ai_prompt: 'System prompt',
                            model_temperature: 0.7,
                            language_model: 1,
                            language_used: 'en',
                        },
                        languageModel: { url: 'model-url' },
                    });
                if (url === '/api/aiPlayer') return Promise.resolve({ player_id: 999 });
                if (url === '/api/languageSuffix/en')
                    return Promise.resolve({ suffix_template: 'suffix {length}' });
                if (url === '/api/getJudgeQuestions/2/10') return Promise.resolve([]);
                if (url === '/api/game/10/judge/2/questionCount') return Promise.resolve(1);
                if (url === '/api/game/answer') return Promise.resolve({ answer_id: 500 });
                return Promise.resolve({});
            });
            getJudgeById.mockResolvedValue({ judge_id: 2 });
            azureService.getAIContextualAnswer.mockResolvedValue({ answer: 'AI response' });

            await handleSendAnswer(mockSocket, mockIo, validData);

            expect(dbService.getPlayerById).toHaveBeenCalledWith(1);
            expect(azureService.getAIContextualAnswer).toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith('answer-sent-success', expect.anything());
        });

        it('should emit error if auth fails', async () => {
            dbService.getPlayerById.mockResolvedValue(null);

            await handleSendAnswer(mockSocket, mockIo, validData);

            expect(mockIo.emit).toHaveBeenCalledWith(
                'send-answer-error',
                expect.objectContaining({
                    error: 'Access denied. Insufficient permissions.',
                }),
            );
        });

        it('should emit error if validation fails', async () => {
            dbService.getPlayerById.mockResolvedValue({ session_token: 'valid-token' });

            await handleSendAnswer(mockSocket, mockIo, { ...validData, answer: '' });

            expect(mockIo.emit).toHaveBeenCalledWith(
                'send-answer-error',
                expect.objectContaining({
                    error: 'Answer is required and must be a non-empty string',
                }),
            );
        });

        it('should handle errors during processing and sanitize database errors', async () => {
            dbService.getPlayerById.mockResolvedValue({ session_token: 'valid-token' });
            dbService.dbClient.mockRejectedValue(new Error('Database error'));

            await handleSendAnswer(mockSocket, mockIo, validData);

            expect(mockIo.to).toHaveBeenCalledWith(mockSocket);
            expect(mockIo.emit).toHaveBeenCalledWith(
                'send-answer-error',
                expect.objectContaining({
                    error: 'Unable to process your answer at this time. Please try again.',
                }),
            );
        });
    });
});
