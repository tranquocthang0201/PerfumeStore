const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function verifyToken(req, res, next) {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Thiếu Bearer token" });
    }

    try {
        req.user = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
        return next();
    } catch (error) {
        const message = error.name === "TokenExpiredError" ? "Token đã hết hạn" : "Token không hợp lệ";
        return res.status(401).json({ message });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Chỉ quản trị viên được phép thực hiện thao tác này" });
    }
    return next();
}

module.exports = { verifyToken, requireAdmin };
