const userModel = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const { requiredString, optionalString } = require("../utils/validation");

async function listUsers() {
    return userModel.list();
}

async function updateMyProfile(userId, payload) {
    const fullName = requiredString(payload.fullName, "Họ tên", 100);
    const phone = optionalString(payload.phone, 20);
    const address = optionalString(payload.address, 255);
    const user = await userModel.updateProfile(userId, { fullName, phone, address });
    if (!user) throw new ApiError(404, "Không tìm thấy người dùng");
    return user;
}

module.exports = { listUsers, updateMyProfile };
