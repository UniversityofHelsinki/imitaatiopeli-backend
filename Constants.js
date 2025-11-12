const SHIBBOLETH_COOKIE_NAME = '_shibsession_';
const ADMIN_GROUP = 'grp-imitationgame-admin';

const EXCEL_COLUMNS = [
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

module.exports = {
    SHIBBOLETH_COOKIE_NAME,
    ADMIN_GROUP,
    EXCEL_COLUMNS,
};
