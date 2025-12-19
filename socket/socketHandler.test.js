const { handleConnection } = require('./socketHandler');
const connectionHandler = require('./handlers/socketConnectionHandler');
const gameHandler = require('./handlers/socketGameHandler');
const socketAnswerService = require('./services/socketAnswerService');
const questionHandler = require('./handlers/socketPlayerQuestionHandler');
const socketPlayerGuessHandler = require('./handlers/socketPlayerGuessHandler');

jest.mock('./handlers/socketConnectionHandler');
jest.mock('./handlers/socketGameHandler');
jest.mock('./services/socketAnswerService');
jest.mock('./handlers/socketPlayerQuestionHandler');
jest.mock('./handlers/socketPlayerGuessHandler');
jest.mock('../logger');

describe('socketHandler', () => {
    let mockIo;
    let mockSocket;
    let connectionCallback;

    beforeEach(() => {
        jest.clearAllMocks();
        mockIo = {};
        mockSocket = {
            id: 'socket-123',
            on: jest.fn(),
        };
        connectionCallback = handleConnection(mockIo);
    });

    it('should set up event listeners on connection', () => {
        connectionCallback(mockSocket);

        expect(mockSocket.on).toHaveBeenCalledWith('send-answer', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('join-game', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('start-game', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('end-game', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('send-question', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('send-guess-to-answer', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('end-judging', expect.any(Function));
    });

    it('should delegate events to correct handlers', async () => {
        connectionCallback(mockSocket);

        // Find the callbacks
        const getCallback = (event) =>
            mockSocket.on.mock.calls.find((call) => call[0] === event)[1];

        // join-game
        await getCallback('join-game')({ data: 'test' });
        expect(connectionHandler.handleJoinGame).toHaveBeenCalledWith(mockSocket, { data: 'test' });

        // send-answer
        await getCallback('send-answer')({ data: 'test' });
        expect(socketAnswerService.handleSendAnswer).toHaveBeenCalledWith(mockSocket, mockIo, {
            data: 'test',
        });

        // start-game
        getCallback('start-game')({ data: 'test' });
        expect(gameHandler.handleStartGame).toHaveBeenCalledWith(
            mockSocket,
            { data: 'test' },
            mockIo,
        );

        // end-game
        getCallback('end-game')({ data: 'test' });
        expect(gameHandler.handleEndGame).toHaveBeenCalledWith(
            mockSocket,
            { data: 'test' },
            mockIo,
        );

        // disconnect
        getCallback('disconnect')();
        expect(connectionHandler.handleDisconnect).toHaveBeenCalledWith(mockSocket);

        // send-question
        await getCallback('send-question')({ data: 'test' });
        expect(questionHandler.handleSendQuestion).toHaveBeenCalledWith(
            mockSocket,
            { data: 'test' },
            mockIo,
        );

        // send-guess-to-answer
        await getCallback('send-guess-to-answer')({ data: 'test' });
        expect(socketPlayerGuessHandler.handleSendGuessToAnswer).toHaveBeenCalledWith(mockSocket, {
            data: 'test',
        });

        // end-judging
        await getCallback('end-judging')({ game: 'game1', rating: 'rating1' });
        expect(socketPlayerGuessHandler.handleSendGuessToAnswer).toHaveBeenCalledWith(
            mockSocket,
            'rating1',
        );
        expect(gameHandler.gameSummary).toHaveBeenCalledWith(mockIo, mockSocket, 'game1');
    });
});
