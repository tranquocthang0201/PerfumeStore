const ApiError = require("../utils/ApiError");
const { env } = require("../config/env");

function notFound(req, res, next) {
    next(new ApiError(404, `Không tìm thấy tài nguyên ${req.method} ${req.originalUrl}`));
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
        console.error(error);
    }

    const response = {
        message: statusCode >= 500 ? "Lỗi máy chủ nội bộ" : error.message
    };

    if (error.details) response.details = error.details;
    if (env.nodeEnv !== "production" && statusCode >= 500) response.error = error.message;

    res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
