const express = require("express");
const { sql, poolPromise } = require("../config/db");

const router = express.Router();

// LẤY DANH SÁCH ĐƠN HÀNG
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const ordersResult = await pool.request().query(`
            SELECT 
                id,
                userId,
                customerName,
                email,
                phone,
                address,
                total,
                status,
                paymentMethod,
                CONVERT(VARCHAR(10), orderDate, 103) AS date
            FROM Orders
            ORDER BY id DESC
        `);

        const itemsResult = await pool.request().query(`
            SELECT 
                id,
                orderId,
                productId,
                productName,
                ml,
                price,
                quantity
            FROM OrderItems
        `);

        const orders = ordersResult.recordset.map(order => {
            return {
                ...order,
                items: itemsResult.recordset.filter(item => item.orderId === order.id)
            };
        });

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi khi lấy danh sách đơn hàng"
        });
    }
});

// TẠO ĐƠN HÀNG
// TẠO ĐƠN HÀNG
router.post("/", async (req, res) => {
    try {
        const {
            customerName,
            email,
            phone,
            address,
            total,
            paymentMethod,
            items
        } = req.body;

        if (!customerName || !phone || !address) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin đặt hàng"
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Giỏ hàng đang trống"
            });
        }

        const finalTotal = Number(total) || items.reduce((sum, item) => {
            return sum + Number(item.price || 0) * Number(item.quantity || 1);
        }, 0);

        const pool = await poolPromise;

        const orderResult = await pool.request()
            .input("customerName", sql.NVarChar, customerName)
            .input("email", sql.NVarChar, email || "")
            .input("phone", sql.NVarChar, phone)
            .input("address", sql.NVarChar, address)
            .input("total", sql.Float, finalTotal)
            .input("paymentMethod", sql.NVarChar, paymentMethod || "COD")
            .query(`
                INSERT INTO Orders (customerName, email, phone, address, total, paymentMethod, status)
                OUTPUT INSERTED.id
                VALUES (@customerName, @email, @phone, @address, @total, @paymentMethod, N'Chờ xác nhận')
            `);

        const orderId = orderResult.recordset[0].id;

        for (const item of items) {
            await pool.request()
                .input("orderId", sql.Int, orderId)
                .input("productId", sql.Int, null)
                .input("productName", sql.NVarChar, item.productName || item.name || "Sản phẩm")
                .input("ml", sql.Int, Number(item.ml) || 0)
                .input("price", sql.Float, Number(item.price) || 0)
                .input("quantity", sql.Int, Number(item.quantity) || 1)
                .query(`
                    INSERT INTO OrderItems (orderId, productId, productName, ml, price, quantity)
                    VALUES (@orderId, @productId, @productName, @ml, @price, @quantity)
                `);
        }

        res.status(201).json({
            message: "Đặt hàng thành công",
            orderId
        });
    } catch (error) {
        console.error("ORDER CREATE ERROR:", error);

        res.status(500).json({
            message: "Lỗi khi tạo đơn hàng",
            error: error.message
        });
    }
});

// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        if (!status) {
            return res.status(400).json({
                message: "Trạng thái không được để trống"
            });
        }

        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.Int, orderId)
            .input("status", sql.NVarChar, status)
            .query(`
                UPDATE Orders
                SET status = @status
                WHERE id = @id
            `);

        res.json({
            message: "Cập nhật trạng thái đơn hàng thành công"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi khi cập nhật trạng thái đơn hàng"
        });
    }
});

module.exports = router;