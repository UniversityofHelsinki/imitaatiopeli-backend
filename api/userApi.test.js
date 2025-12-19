const userApi = require('./userApi');
const userService = require('../services/userService');

jest.mock('../services/userService');

describe('userApi', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            user: {
                eppn: 'test@example.com',
                displayName: 'Test User',
            },
        };
        mockRes = {
            json: jest.fn(),
        };
    });

    describe('getLoggedUser', () => {
        it('should return decoded user data', () => {
            const mockDecodedUser = {
                eppn: 'test',
                displayName: 'Test User',
                hyGroupCn: [],
                preferredLanguage: 'en',
            };
            userService.getLoggedUser.mockReturnValue(mockDecodedUser);

            userApi.getLoggedUser(mockReq, mockRes);

            expect(userService.getLoggedUser).toHaveBeenCalledWith(mockReq.user);
            expect(mockRes.json).toHaveBeenCalledWith(mockDecodedUser);
        });
    });
});
