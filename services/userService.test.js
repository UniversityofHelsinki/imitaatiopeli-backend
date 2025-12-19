const userService = require('./userService');
const utf8 = require('utf8');

jest.mock('utf8');

describe('userService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLoggedUser', () => {
        it('should decode user properties correctly', () => {
            const mockUser = {
                eppn: 'user@example.com',
                hyGroupCn: 'group1;group2',
                preferredLanguage: 'en',
                displayName: 'Test User',
            };

            utf8.decode.mockImplementation((val) => val);

            const result = userService.getLoggedUser(mockUser);

            expect(result).toEqual({
                eppn: 'user',
                hyGroupCn: ['group1', 'group2'],
                preferredLanguage: 'en',
                displayName: 'Test User',
            });

            expect(utf8.decode).toHaveBeenCalledWith('user');
            expect(utf8.decode).toHaveBeenCalledWith('group1;group2');
            expect(utf8.decode).toHaveBeenCalledWith('en');
            expect(utf8.decode).toHaveBeenCalledWith('Test User');
        });

        it('should handle different eppn formats', () => {
            const mockUser = {
                eppn: 'anotheruser',
                hyGroupCn: '',
                preferredLanguage: 'fi',
                displayName: 'Matti Meikäläinen',
            };

            utf8.decode.mockImplementation((val) => val);

            const result = userService.getLoggedUser(mockUser);

            expect(result.eppn).toBe('anotheruser');
        });
    });
});
