const { logger } = require('../../logger');
const socketUserService = require('../services/socketUserService');
const dbApi = require('../../api/dbApi');
const { dbClient } = require('../../services/dbService');
const { emitError } = require('../services/socketAnswerService');

const handleSendQuestion = async (socket, data, io) => {
    const { judgeId, gameId, questionText } = data;

    try {
        const pairs = await dbClient(`/api/players/pairs/${gameId}/${judgeId}`);
        const targetPlayer = pairs.find((pair) => pair.judge_id === judgeId).player_id;
        const playerSockets = socketUserService.getUserSockets(parseInt(targetPlayer));

        //Uutta kysymystä ei voi tallentaa, jos edelliseen ei ole tullut vastauksia. Jos tulee uusi kysymys ja aikaisempiin
        //ei ole tullut vastauksia, niin anna herja ja pyydä virkistämään selain
        const answerCountAndQuestionCount = await dbClient(
            `api/getAnswerCountQuestionCountByGameIdJudgeId/${gameId}/${judgeId}`,
        );
        const data =
            typeof answerCountAndQuestionCount === 'string'
                ? JSON.parse(answerCountAndQuestionCount)
                : answerCountAndQuestionCount;
        const answerCount = data.answer_count;
        const questionCount = data.question_count;
        if (answerCount < questionCount) {
            socket.emit('question-sent-error', {
                error: 'judge_messenger_missing_answer',
            });
            return;
        }

        //jos tuomarilla on 0 kysymystä, niin hän voi esittää uuden kysymyksen. Jos tuomarilla taas on
        //olemassa aikaisempi kysymys,
        //niin siihen pitäisi liittyä yksi arvio. Vasta arvion jälkeen voi esittää uuden kysymyksen
        const judgeGuessAndQuestionsCounts = await dbClient(
            `api/getJudgeGuessAndQuestionCounts/${gameId}/${judgeId}`,
        );
        const counts =
            typeof judgeGuessAndQuestionsCounts === 'string'
                ? JSON.parse(judgeGuessAndQuestionsCounts)
                : judgeGuessAndQuestionsCounts;
        const guessCount = counts.guess_count;
        const judgeQuestionCount = counts.question_count;
        if (judgeQuestionCount !== 0 && guessCount !== judgeQuestionCount) {
            socket.emit('question-sent-error', {
                error: 'judge_messenger_missing_judge_guess',
            });
            return;
        }

        if (playerSockets.length === 0) {
            logger.warn(`No sockets found for judge ${judgeId}`);
            socket.emit('question-sent-error', {
                error: 'judge_messenger_missing_player',
            });
            return;
        }

        const question = await dbApi.saveQuestion({
            judgeId,
            gameId,
            questionText,
        });

        playerSockets.forEach((socketInfo) => {
            if (socketInfo.gameId === parseInt(gameId, 10)) {
                io.to(socketInfo.socketId).emit('send-question', {
                    questionId: question.question_id,
                    gameId: parseInt(gameId, 10),
                    content: question.question_text,
                    judgeId: judgeId,
                    created: question.created,
                });
            }
        });

        console.log('judge socketId: ', socket.id);
        socket.emit('question-sent-success', {
            questionId: question.questionId,
            judgeId,
            gameId: parseInt(gameId, 10),
        });

        logger.info(`Judge ${judgeId} sent question to player in game ${gameId}`);
    } catch (error) {
        logger.warn(`Send question error: ${error.message}`);
        socket.emit('question-sent-error', {
            error: error.message,
        });
    }
};

module.exports = {
    handleSendQuestion,
};
