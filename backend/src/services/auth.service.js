const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const { env } = require("../config/env");
const {
    requiredString,
    optionalString,
    normalizeEmail,
    normalizePassword
} = require("../utils/validation");

function publicUser(user) {
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role
    };
}

function createToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn, algorithm: "HS256" }
    );
}

async function register(payload) {
    const fullName = requiredString(payload.fullName, "Họ tên", 100);
    const email = normalizeEmail(payload.email);
    const password = normalizePassword(payload.password);
    const phone = optionalString(payload.phone, 20);
    const address = optionalString(payload.address, 255);

    if (await userModel.findByEmail(email)) {
        throw new ApiError(409, "Email đã được sử dụng");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userModel.create({ fullName, email, passwordHash, phone, address });
    return { user: publicUser(user) };
}

async function login(payload) {
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || "");
    const user = await userModel.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ApiError(401, "Email hoặc mật khẩu không đúng");
    }

    return { token: createToken(user), user: publicUser(user) };
}

async function getCurrentUser(userId) {
    const user = await userModel.findById(userId);
    if (!user) throw new ApiError(404, "Không tìm thấy người dùng");
    return publicUser(user);
}

module.exports = { register, login, getCurrentUser, createToken, publicUser };
