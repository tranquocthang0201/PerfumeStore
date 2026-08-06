const { getPool } = require("../config/db");

function number(value) {
    return Number(value || 0);
}

async function getDashboardReport() {
    const pool = await getPool();

    const [summaryResult, statusResult, dailyResult, brandResult, categoryResult, topResult, lowStockResult] = await Promise.all([
        pool.request().query(`
            SELECT
                COUNT(*) AS totalOrders,
                SUM(CASE WHEN status = N'Chờ xác nhận' THEN 1 ELSE 0 END) AS pendingOrders,
                SUM(CASE WHEN status = N'Giao thành công' THEN 1 ELSE 0 END) AS completedOrders,
                SUM(CASE WHEN status = N'Giao thành công' THEN total ELSE 0 END) AS completedRevenue,
                SUM(CASE WHEN status <> N'Đã hủy' THEN total ELSE 0 END) AS activeOrderValue,
                (SELECT COUNT(*) FROM Products) AS totalProducts,
                (SELECT COUNT(*) FROM Users WHERE role = N'user') AS totalUsers
            FROM Orders
        `),
        pool.request().query(`
            SELECT status, COUNT(*) AS orderCount
            FROM Orders
            GROUP BY status
            ORDER BY orderCount DESC
        `),
        pool.request().query(`
            SELECT CONVERT(VARCHAR(10), CAST(orderDate AS DATE), 23) AS [date],
                   COUNT(*) AS orderCount,
                   SUM(CASE WHEN status <> N'Đã hủy' THEN total ELSE 0 END) AS orderValue,
                   SUM(CASE WHEN status = N'Giao thành công' THEN total ELSE 0 END) AS completedRevenue
            FROM Orders
            WHERE orderDate >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
            GROUP BY CAST(orderDate AS DATE)
            ORDER BY CAST(orderDate AS DATE) ASC
        `),
        pool.request().query(`
            SELECT COALESCE(b.name, p.brand) AS brandName, p.brand AS brandSlug,
                   SUM(oi.quantity) AS quantitySold,
                   SUM(oi.price * oi.quantity) AS orderValue
            FROM OrderItems oi
            INNER JOIN Orders o ON o.id = oi.orderId
            INNER JOIN Products p ON p.id = oi.productId
            LEFT JOIN Brands b ON b.slug = p.brand
            WHERE o.status <> N'Đã hủy'
            GROUP BY COALESCE(b.name, p.brand), p.brand
            ORDER BY orderValue DESC
        `),
        pool.request().query(`
            SELECT p.type, COALESCE(c.name, p.type) AS categoryName, COUNT(*) AS productCount
            FROM Products p
            LEFT JOIN Categories c ON c.slug = p.type
            GROUP BY p.type, COALESCE(c.name, p.type)
            ORDER BY productCount DESC
        `),
        pool.request().query(`
            SELECT TOP 5 p.id, p.code, p.name,
                   SUM(oi.quantity) AS quantitySold,
                   SUM(oi.price * oi.quantity) AS orderValue,
                   COALESCE(stock.totalStock, 0) AS totalStock
            FROM OrderItems oi
            INNER JOIN Orders o ON o.id = oi.orderId
            INNER JOIN Products p ON p.id = oi.productId
            OUTER APPLY (
                SELECT SUM(ps.stock) AS totalStock
                FROM ProductSizes ps
                WHERE ps.productId = p.id
            ) stock
            WHERE o.status <> N'Đã hủy'
            GROUP BY p.id, p.code, p.name, stock.totalStock
            ORDER BY quantitySold DESC, orderValue DESC
        `),
        pool.request().query(`
            SELECT p.id, p.code, p.name, ps.ml, ps.stock
            FROM ProductSizes ps
            INNER JOIN Products p ON p.id = ps.productId
            WHERE ps.stock <= 5
            ORDER BY ps.stock ASC, p.name ASC, ps.ml ASC
        `)
    ]);

    const summaryRow = summaryResult.recordset[0] || {};

    return {
        summary: {
            totalOrders: number(summaryRow.totalOrders),
            pendingOrders: number(summaryRow.pendingOrders),
            completedOrders: number(summaryRow.completedOrders),
            completedRevenue: number(summaryRow.completedRevenue),
            activeOrderValue: number(summaryRow.activeOrderValue),
            totalProducts: number(summaryRow.totalProducts),
            totalUsers: number(summaryRow.totalUsers)
        },
        orderStatus: statusResult.recordset.map((row) => ({
            status: row.status,
            orderCount: number(row.orderCount)
        })),
        daily: dailyResult.recordset.map((row) => ({
            date: row.date,
            orderCount: number(row.orderCount),
            orderValue: number(row.orderValue),
            completedRevenue: number(row.completedRevenue)
        })),
        orderValueByBrand: brandResult.recordset.map((row) => ({
            brandName: row.brandName,
            brandSlug: row.brandSlug,
            quantitySold: number(row.quantitySold),
            orderValue: number(row.orderValue)
        })),
        categoryDistribution: categoryResult.recordset.map((row) => ({
            type: row.type,
            categoryName: row.categoryName,
            productCount: number(row.productCount)
        })),
        topProducts: topResult.recordset.map((row) => ({
            id: row.code || String(row.id),
            dbId: row.id,
            name: row.name,
            quantitySold: number(row.quantitySold),
            orderValue: number(row.orderValue),
            totalStock: number(row.totalStock)
        })),
        lowStock: lowStockResult.recordset.map((row) => ({
            id: row.code || String(row.id),
            dbId: row.id,
            name: row.name,
            ml: number(row.ml),
            stock: number(row.stock)
        }))
    };
}

module.exports = { getDashboardReport };
