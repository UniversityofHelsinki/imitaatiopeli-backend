const { dbClient } = require('../../services/dbService');
const { logger } = require('../../logger');

const saveGuessToDatabase = async (data) => {
    try {
        return await dbClient('/api/guess/save', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        logger.error('Database save failed:', error);
        throw new Error('Failed to save guess to database');
    }
};

module.exports = {
    saveGuessToDatabase,
};
