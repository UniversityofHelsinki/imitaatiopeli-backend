const { dbClient } = require('../../services/dbService');
const { saveGuessToDatabase } = require('../services/socketGuessService');

const handleSendGuessToAnswer = async (socket, data) => {
    const { confidence, answerId, argument } = data;

    if (!confidence || !answerId || !argument) {
        console.error('Missing required fields in data:', data);
        return;
    }

    console.log('send guess to answer', {
        confidence,
        answerId,
        argument,
    });

    const guessAnswer = await dbClient(`/api/getAnswerById/${answerId}`);

    if (!guessAnswer) {
        console.error('Answer not found:', answerId);
        return;
    }

    const originalQuestion = await dbClient(`/api/question/${guessAnswer?.question_id}`);

    const body = {
        questionId: originalQuestion.question_id,
        confidence: confidence,
        result: guessAnswer.is_pretender,
        judgeId: originalQuestion.judge_id,
        answerId: guessAnswer.answer_id,
        argument: argument,
    };

    console.log('Attempting to save guess with body:', body);

    try {
        const result = await saveGuessToDatabase(body);
        console.log('Guess saved successfully:', result);
    } catch (error) {
        console.error('Error saving guess:', error);
        console.error('Error details:', error.message, error.stack);
    }
};

module.exports = {
    handleSendGuessToAnswer,
};
