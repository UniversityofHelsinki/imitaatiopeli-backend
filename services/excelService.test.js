const excelService = require('./excelService');
const ExcelJS = require('exceljs');

jest.mock('exceljs');

describe('excelService', () => {
    let mockWorkbook;
    let mockWorksheet;
    let mockRow;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRow = {
            font: {},
            fill: {},
        };

        mockWorksheet = {
            addRow: jest.fn(),
            getRow: jest.fn().mockReturnValue(mockRow),
            columns: [],
        };

        mockWorkbook = {
            addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        };

        ExcelJS.Workbook.mockImplementation(() => mockWorkbook);
    });

    describe('createWorkbookFromGameData', () => {
        it('should create a workbook with Game Data and Game Info worksheets', () => {
            const mockData = {
                gameData: [
                    {
                        player_name: 'Player1',
                        respondent: 'R1',
                        player: 'P1',
                        sequence: 1,
                        question: 'Q1',
                        pretender: 'P1',
                        non_pretender: 'NP1',
                        assessment: 'A1',
                        correct: true,
                        confidence: 5,
                        final_assessment: 'FA1',
                        final_correct: true,
                        final_confidence: 5,
                    },
                ],
                gameConfiguration: {
                    game_name: 'Test Game',
                    theme_description: 'Test Theme',
                    ai_prompt: 'System Prompt',
                    is_research_game: true,
                    research_description: 'Research Desc',
                    instructions_for_players: 'Instructions',
                },
                promptSuffixTemplate: [{ suffix_template: 'Suffix' }],
                languageModel: { name: 'GPT-4' },
            };

            const workbook = excelService.createWorkbookFromGameData(mockData);

            expect(ExcelJS.Workbook).toHaveBeenCalled();
            expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Game Data');
            expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Game Info');

            expect(mockWorksheet.addRow).toHaveBeenCalled();
            expect(workbook).toBe(mockWorkbook);
        });

        it('should handle sequence 999 as Final', () => {
            const mockData = {
                gameData: [{ sequence: 999 }],
                gameConfiguration: {},
                promptSuffixTemplate: [],
                languageModel: {},
            };

            excelService.createWorkbookFromGameData(mockData);

            expect(mockWorksheet.addRow).toHaveBeenCalledWith(
                expect.objectContaining({
                    sequence: 'Final',
                }),
            );
        });
    });

    describe('setExcelDownloadHeaders', () => {
        it('should set the correct headers on the response object', () => {
            const mockRes = {
                setHeader: jest.fn(),
            };
            const gameId = '123';

            excelService.setExcelDownloadHeaders(mockRes, gameId);

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                `attachment; filename=game_${gameId}_data.xlsx`,
            );
        });
    });
});
