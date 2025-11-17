const SHIBBOLETH_COOKIE_NAME = '_shibsession_';
const ADMIN_GROUP = 'grp-imitationgame-admin';

const EXCEL_DATA_COLUMNS = [
    { header: 'Player', key: 'player', width: 10 },
    { header: 'Sequence', key: 'sequence', width: 10 },
    { header: 'Question', key: 'question', width: 40 },
    { header: 'Pretender', key: 'pretender', width: 40 },
    { header: 'Non-pretender', key: 'non_pretender', width: 40 },
    { header: 'Assessment', key: 'assessment', width: 40 },
    { header: 'Correct', key: 'correct', width: 10 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Final Assessment', key: 'final_assessment', width: 40 },
    { header: 'Final Correct', key: 'final_correct', width: 12 },
    { header: 'Final Confidence', key: 'final_confidence', width: 15 },
];

const EXCEL_INFO_COLUMNS = [
    { header: 'Game Name', key: 'game_name', width: 10 },
    { header: 'Theme Description', key: 'theme_description', width: 10 },
    { header: 'AI Prompt', key: 'ai_prompt', width: 10 },
    { header: 'Language Model', key: 'language_model', width: 10 },
    { header: 'Model Temperature', key: 'model_temperature', width: 10 },
    { header: 'Is Research Game', key: 'is_research_game', width: 10 },
    { header: 'Research Description', key: 'research_description', width: 10 },
    { header: 'Instructions For Players', key: 'instructions_for_players', width: 50 },
];

module.exports = {
    SHIBBOLETH_COOKIE_NAME,
    ADMIN_GROUP,
    EXCEL_DATA_COLUMNS,
    EXCEL_INFO_COLUMNS,
};
