const orderModel = require("../models/order.model");
const ApiError = require("../utils/ApiError");
const {
    requiredString,
    optionalString,
    positiveInteger
} = require("../utils/validation");

const ALLOWED_STATUSES = ["Chờ xác nhận", "Đã xác nhận", "Đang giao", "Giao thành công", "Đã hủy"];
const ALLOWED_PAYMENT_METHODS = ["COD", "Chuyển khoản / QR"];

function normalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "Giỏ hàng đang trống");
    if (items.length > 50) throw new ApiError(400, "Đơn hàng vượt quá 50 dòng sản phẩm");

    return items.map((item) => ({
        productId: requiredString(item.productId || item.id || item.code, "Mã sản phẩm", 100),
        ml: positiveInteger(item.ml, "Dung tích"),
        quantity: positiveInteger(item.quantity || 1, "Số lượng")
    }));
}

async function createOrder(authUser, payload) {
    const customerName = requiredString(payload.customerName || authUser.fullName, "Tên người nhận", 100);
    const phone = requiredString(payload.phone, "Số điện thoại", 20);
    const address = requiredString(payload.address, "Địa chỉ", 255);
    const paymentMethod = optionalString(payload.paymentMethod || "COD", 50) || "COD";
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) throw new ApiError(400, "Phương thức thanh toán không hợp lệ");

    return orderModel.create({
        userId: authUser.id,
        customerName,
        email: authUser.email,
        phone,
        address,
        paymentMethod,
        items: normalizeItems(payload.items)
    });
}

async function listAllOrders() {
    return orderModel.list();
}

async function listMyOrders(userId) {
    return orderModel.list({ userId });
}

async function getOrder(authUser, id) {
    const order = await orderModel.findById(positiveInteger(id, "Mã đơn hàng"));
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");
    if (authUser.role !== "admin" && order.userId !== authUser.id) {
        throw new ApiError(403, "Bạn không có quyền xem đơn hàng này");
    }
    return order;
}

async function updateStatus(id, payload) {
    const status = requiredString(payload.status, "Trạng thái", 50);
    if (!ALLOWED_STATUSES.includes(status)) throw new ApiError(400, "Trạng thái đơn hàng không hợp lệ");
    const updated = await orderModel.updateStatus(positiveInteger(id, "Mã đơn hàng"), status);
    if (!updated) throw new ApiError(404, "Không tìm thấy đơn hàng");
}

async function cancelMyOrder(userId, id) {
    const result = await orderModel.cancelByOwner(positiveInteger(id, "Mã đơn hàng"), userId);
    if (!result.found) throw new ApiError(404, "Không tìm thấy đơn hàng");
    if (!result.cancellable) throw new ApiError(409, "Chỉ có thể hủy đơn đang chờ xác nhận");
}

module.exports = {
    ALLOWED_STATUSES,
    normalizeItems,
    createOrder,
    listAllOrders,
    listMyOrders,
    getOrder,
    updateStatus,
    cancelMyOrder
};
