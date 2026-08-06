const orderService = require("../services/order.service");

async function list(req, res) {
    res.json(await orderService.listAllOrders());
}

async function listMine(req, res) {
    res.json(await orderService.listMyOrders(req.user.id));
}

async function getById(req, res) {
    res.json(await orderService.getOrder(req.user, req.params.id));
}

async function create(req, res) {
    const order = await orderService.createOrder(req.user, req.body);
    res.status(201).json({ message: "Đặt hàng thành công", ...order });
}

async function updateStatus(req, res) {
    await orderService.updateStatus(req.params.id, req.body);
    res.json({ message: "Cập nhật trạng thái đơn hàng thành công" });
}

async function cancelMine(req, res) {
    await orderService.cancelMyOrder(req.user.id, req.params.id);
    res.json({ message: "Hủy đơn hàng thành công" });
}

module.exports = { list, listMine, getById, create, updateStatus, cancelMine };
