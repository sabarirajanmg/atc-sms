const UNEXPECTED_ERROR_MESSAGE = 'unknown failure';
const AUTHENTICATION_FAILED = 'authentication failed';

const unexpectedError = (res, error = UNEXPECTED_ERROR_MESSAGE) => res.status(500).json({ error });
const authenticationFailed = (res, error = AUTHENTICATION_FAILED) => res.status(403).json({ error });
const errorResponse = (res, error = UNEXPECTED_ERROR_MESSAGE) => res.status(400).json({ error });
const successResponse = (res, message, data) => res.json({ data, message });

module.exports = {
    unexpectedError,
    authenticationFailed,
    errorResponse,
    successResponse,
};
