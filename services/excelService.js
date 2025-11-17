const ExcelJS = require('exceljs');
const constants = require('../Constants');

const styleWorksheetHeader = (worksheet) => {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
    };
};

const createWorkbookFromGameData = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Game Data');
    worksheet.columns = constants.EXCEL_DATA_COLUMNS;

    for (const row of data.gameData) {
        worksheet.addRow({
            player: row.player,
            sequence: row.sequence === 999 ? 'Final' : row.sequence,
            question: row.question,
            pretender: row.pretender,
            non_pretender: row.non_pretender,
            assessment: row.assessment,
            correct: row.correct,
            confidence: row.confidence,
            final_assessment: row.final_assessment,
            final_correct: row.final_correct,
            final_confidence: row.final_confidence,
        });
    }

    styleWorksheetHeader(worksheet);

    const worksheet2 = workbook.addWorksheet('Game Info');
    worksheet2.columns = constants.EXCEL_INFO_COLUMNS;

    worksheet2.addRow({
        game_name: data.gameConfiguration?.game_name,
        theme_description: data.gameConfiguration?.theme_description,
        ai_prompt:
            data.gameConfiguration?.ai_prompt +
            ' , ' +
            data.promptSuffixTemplate?.[0]?.suffix_template,
        language_model: data.languageModel?.name,
        model_temperature: data.gameConfiguration?.model_temperature,
        is_research_game: data.gameConfiguration?.is_research_game,
        research_description: data.gameConfiguration?.research_description,
        instructions_for_players: data.gameConfiguration?.instructions_for_players,
    });

    styleWorksheetHeader(worksheet2);

    return workbook;
};

const setExcelDownloadHeaders = (res, gameId) => {
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=game_${gameId}_data.xlsx`);
};

exports.createWorkbookFromGameData = createWorkbookFromGameData;
exports.setExcelDownloadHeaders = setExcelDownloadHeaders;
