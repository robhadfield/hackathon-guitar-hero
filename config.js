import dotenv from 'dotenv';

dotenv.config();

function envString(key) {
    const { env } = process;
    const value = env[key];
    if (typeof value !== 'string') {
        throw new Error(`Mandatory env variable "${key}" not found`);
    }

    return value;
}

export const config = {
    host: envString('SLIDO_API_HOST'),
    userId: envString('TEMP_CURRENT_ACCOUNT_UUID'),
    token: envString('TOKEN'),
    eventId: envString('EVENT_ID'),
    pollId: envString('POLL_UUID'),
    questionId: envString('QUESTION_UUID'),
};
