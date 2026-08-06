const ApiError = require("./ApiError");

function requiredString(value, field, maxLength = 255) {
    const normalized = String(value || "").trim();
    if (!normalized) throw new ApiError(400, `${field} không được để trống`);
    if (normalized.length > maxLength) throw new ApiError(400, `${field} tối đa ${maxLength} ký tự`);
    return normalized;
}

function optionalString(value, maxLength = 255) {
    const normalized = String(value || "").trim();
    if (normalized.length > maxLength) throw new ApiError(400, `Dữ liệu tối đa ${maxLength} ký tự`);
    return normalized;
}

function normalizeEmail(value) {
    const email = requiredString(value, "Email", 100).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError(400, "Email không hợp lệ");
    }
    return email;
}

function normalizePassword(value) {
    const password = String(value || "");
    if (password.length < 8) throw new ApiError(400, "Mật khẩu phải có ít nhất 8 ký tự");
    if (password.length > 72) throw new ApiError(400, "Mật khẩu tối đa 72 ký tự");
    return password;
}

function positiveInteger(value, field, { allowZero = false } = {}) {
    const parsed = Number(value);
    const min = allowZero ? 0 : 1;
    if (!Number.isInteger(parsed) || parsed < min) {
        throw new ApiError(400, `${field} phải là số nguyên ${allowZero ? "không âm" : "dương"}`);
    }
    return parsed;
}

function nonNegativeNumber(value, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new ApiError(400, `${field} phải là số không âm`);
    }
    return parsed;
}

module.exports = {
    requiredString,
    optionalString,
    normalizeEmail,
    normalizePassword,
    positiveInteger,
    nonNegativeNumber
};
