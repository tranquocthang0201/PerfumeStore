const { sql, getPool } = require("../config/db");
const ApiError = require("../utils/ApiError");

function combineOrders(orderRows, itemRows) {
    const itemsByOrder = new Map();
    for (const item of itemRows) {
        if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
        itemsByOrder.get(item.orderId).push({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            ml: item.ml,
            price: Number(item.price),
            quantity: item.quantity
        });
    }

    return orderRows.map((order) => ({
        ...order,
        total: Number(order.total),
        items: itemsByOrder.get(order.id) || []
    }));
}

async function list({ userId } = {}) {
    const pool = await getPool();
    const orderRequest = pool.request().input("userId", sql.Int, userId || null);
    const ordersResult = await orderRequest.query(`
        SELECT id, userId, customerName, email, phone, address, total, status, paymentMethod,
               CONVERT(VARCHAR(10), orderDate, 103) AS date,
               orderDate
        FROM Orders
        WHERE (@userId IS NULL OR userId = @userId)
        ORDER BY id DESC
    `);

    if (ordersResult.recordset.length === 0) return [];

    const itemsResult = await pool.request()
        .input("userId", sql.Int, userId || null)
        .query(`
            SELECT oi.id, oi.orderId, oi.productId, oi.productName, oi.ml, oi.price, oi.quantity
            FROM OrderItems oi
            INNER JOIN Orders o ON o.id = oi.orderId
            WHERE (@userId IS NULL OR o.userId = @userId)
            ORDER BY oi.id ASC
        `);

    return combineOrders(ordersResult.recordset, itemsResult.recordset);
}

async function findById(id) {
    const pool = await getPool();
    const orders = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT id, userId, customerName, email, phone, address, total, status, paymentMethod,
                   CONVERT(VARCHAR(10), orderDate, 103) AS date, orderDate
            FROM Orders WHERE id = @id
        `);
    if (!orders.recordset[0]) return null;

    const items = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT id, orderId, productId, productName, ml, price, quantity
            FROM OrderItems WHERE orderId = @id ORDER BY id ASC
        `);
    return combineOrders(orders.recordset, items.recordset)[0];
}

async function create({ userId, customerName, email, phone, address, paymentMethod, items }) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
        const resolvedItems = [];
        let total = 0;

        for (const item of items) {
            const result = await new sql.Request(transaction)
                .input("identifier", sql.NVarChar(100), item.productId)
                .input("ml", sql.Int, item.ml)
                .query(`
                    SELECT TOP 1 p.id AS productId, p.name AS productName, p.discount,
                           s.id AS sizeId, s.ml, s.price, s.stock
                    FROM Products p
                    INNER JOIN ProductSizes s WITH (UPDLOCK, ROWLOCK)
                        ON p.id = s.productId
                    WHERE (p.id = TRY_CONVERT(INT, @identifier) OR p.code = @identifier)
                      AND s.ml = @ml
                `);

            const product = result.recordset[0];
            if (!product) throw new ApiError(400, `Sản phẩm ${item.productId} - ${item.ml}ml không tồn tại`);
            if (product.stock < item.quantity) {
                throw new ApiError(409, `${product.productName} ${product.ml}ml chỉ còn ${product.stock} sản phẩm`);
            }

            const originalPrice = Number(product.price);
            const discount = Math.max(0, Math.min(99, Number(product.discount || 0)));
            const price = Math.round(originalPrice * (100 - discount)) / 100;
            total += price * item.quantity;
            resolvedItems.push({ ...product, price, quantity: item.quantity });
        }

        const orderResult = await new sql.Request(transaction)
            .input("userId", sql.Int, userId)
            .input("customerName", sql.NVarChar(100), customerName)
            .input("email", sql.NVarChar(100), email)
            .input("phone", sql.NVarChar(20), phone)
            .input("address", sql.NVarChar(255), address)
            .input("total", sql.Decimal(18, 2), total)
            .input("paymentMethod", sql.NVarChar(50), paymentMethod)
            .query(`
                INSERT INTO Orders (userId, customerName, email, phone, address, total, paymentMethod, status)
                OUTPUT INSERTED.id
                VALUES (@userId, @customerName, @email, @phone, @address, @total, @paymentMethod, N'Chờ xác nhận')
            `);

        const orderId = orderResult.recordset[0].id;

        for (const item of resolvedItems) {
            await new sql.Request(transaction)
                .input("sizeId", sql.Int, item.sizeId)
                .input("quantity", sql.Int, item.quantity)
                .query("UPDATE ProductSizes SET stock = stock - @quantity WHERE id = @sizeId");

            await new sql.Request(transaction)
                .input("orderId", sql.Int, orderId)
                .input("productId", sql.Int, item.productId)
                .input("productName", sql.NVarChar(150), item.productName)
                .input("ml", sql.Int, item.ml)
                .input("price", sql.Decimal(18, 2), item.price)
                .input("quantity", sql.Int, item.quantity)
                .query(`
                    INSERT INTO OrderItems (orderId, productId, productName, ml, price, quantity)
                    VALUES (@orderId, @productId, @productName, @ml, @price, @quantity)
                `);
        }

        await transaction.commit();
        return { orderId, total };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function updateStatus(id, status) {
    const pool = await getPool();
    const result = await pool.request()
        .input("id", sql.Int, id)
        .input("status", sql.NVarChar(50), status)
        .query(`
            UPDATE Orders
            SET status = @status, updatedAt = GETDATE()
            OUTPUT INSERTED.id
            WHERE id = @id
        `);
    return Boolean(result.recordset[0]);
}

async function cancelByOwner(id, userId) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const order = await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .input("userId", sql.Int, userId)
            .query(`
                SELECT TOP 1 id, status FROM Orders WITH (UPDLOCK, ROWLOCK)
                WHERE id = @id AND userId = @userId
            `);

        if (!order.recordset[0]) {
            await transaction.rollback();
            return { found: false };
        }
        if (order.recordset[0].status !== "Chờ xác nhận") {
            await transaction.rollback();
            return { found: true, cancellable: false };
        }

        const items = await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .query("SELECT productId, ml, quantity FROM OrderItems WHERE orderId = @id");

        for (const item of items.recordset) {
            await new sql.Request(transaction)
                .input("productId", sql.Int, item.productId)
                .input("ml", sql.Int, item.ml)
                .input("quantity", sql.Int, item.quantity)
                .query(`
                    UPDATE ProductSizes SET stock = stock + @quantity
                    WHERE productId = @productId AND ml = @ml
                `);
        }

        await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .query("UPDATE Orders SET status = N'Đã hủy', updatedAt = GETDATE() WHERE id = @id");

        await transaction.commit();
        return { found: true, cancellable: true };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = { list, findById, create, updateStatus, cancelByOwner, combineOrders };
