const { handleSendQuestion } = require('./socketPlayerQuestionHandler');
const socketUserService = require('../services/socketUserService');
const dbApi = require('../../api/dbApi');
const dbService = require('../../services/dbService');

jest.mock('../services/socketUserService');
jest.mock('../../api/dbApi');
jest.mock('../../services/dbService');
jest.mock('../../logger');

describe('socketPlayerQuestionHandler', () => {
    let mockSocket;
    let mockIo;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSocket = {
            id: 'judge-socket-id',
            emit: jest.fn(),
        };
        mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
    });

    it('should save question and notify player sockets', async () => {
        const data = { judgeId: 1, gameId: 10, questionText: 'Test question?' };
        dbService.dbClient.mockResolvedValue([{ judge_id: 1, player_id: 2 }]);
        socketUserService.getUserSockets.mockReturnValue([
            { socketId: 'player-socket-id', gameId: 10 },
        ]);
        dbApi.saveQuestion.mockResolvedValue({
            question_id: 100,
            question_text: 'Test question?',
            created: 'now',
        });

        await handleSendQuestion(mockSocket, data, mockIo);

        expect(dbApi.saveQuestion).toHaveBeenCalledWith({
            judgeId: 1,
            gameId: 10,
            questionText: 'Test question?',
        });
        expect(mockIo.to).toHaveBeenCalledWith('player-socket-id');
        expect(mockIo.emit).toHaveBeenCalledWith(
            'send-question',
            expect.objectContaining({
                questionId: 100,
                content: 'Test question?',
            }),
        );
        expect(mockSocket.emit).toHaveBeenCalledWith(
            'question-sent-success',
            expect.objectContaining({
                judgeId: 1,
                gameId: 10,
            }),
        );
    });

    it('should handle errors and emit question-sent-error', async () => {
        const data = { judgeId: 1, gameId: 10, questionText: 'Test question?' };
        dbService.dbClient.mockRejectedValue(new Error('DB fail'));

        await handleSendQuestion(mockSocket, data, mockIo);

        expect(mockSocket.emit).toHaveBeenCalledWith('question-sent-error', {
            error: 'DB fail',
        });
    });

    it('should return early if no player sockets found', async () => {
        const data = { judgeId: 1, gameId: 10, questionText: 'Test question?' };
        dbService.dbClient.mockResolvedValue([{ judge_id: 1, player_id: 2 }]);
        socketUserService.getUserSockets.mockReturnValue([]);
        dbApi.saveQuestion.mockResolvedValue({ question_id: 100 });

        await handleSendQuestion(mockSocket, data, mockIo);

        expect(mockIo.to).not.toHaveBeenCalled();
        expect(mockSocket.emit).not.toHaveBeenCalledWith(
            'question-sent-success',
            expect.anything(),
        );
    });
});
