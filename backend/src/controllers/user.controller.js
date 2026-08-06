const userService = require("../services/user.service");

async function list(req, res) {
    res.json(await userService.listUsers());
}

async function updateMe(req, res) {
    const user = await userService.updateMyProfile(req.user.id, req.body);
    res.json({ message: "Cập nhật hồ sơ thành công", user });
}

module.exports = { list, updateMe };
