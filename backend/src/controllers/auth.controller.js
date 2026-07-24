const authService = require("../services/auth.service");

async function register(req, res) {
    const result = await authService.register(req.body);
    res.status(201).json({ message: "Đăng ký thành công", ...result });
}

async function login(req, res) {
    const result = await authService.login(req.body);
    res.json({ message: "Đăng nhập thành công", ...result });
}

async function me(req, res) {
    res.json(await authService.getCurrentUser(req.user.id));
}

module.exports = { register, login, me };
