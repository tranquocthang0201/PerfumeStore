const express = require("express");
const { sql, poolPromise } = require("../config/db");

const router = express.Router();

// LẤY DANH SÁCH SẢN PHẨM
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT 
                p.id,
                p.code,
                p.name,
                p.image,
                p.shortDesc,
                p.type,
                p.brand,
                s.id AS sizeId,
                s.ml,
                s.price,
                s.stock
            FROM Products p
            LEFT JOIN ProductSizes s ON p.id = s.productId
            ORDER BY p.id DESC, s.ml ASC
        `);

        const map = new Map();

        result.recordset.forEach(row => {
            if (!map.has(row.id)) {
                map.set(row.id, {
                    id: row.code || String(row.id),
                    dbId: row.id,
                    code: row.code,
                    name: row.name,
                    image: row.image,
                    short: row.shortDesc,
                    shortDesc: row.shortDesc,
                    type: row.type,
                    brand: row.brand,
                    sizes: []
                });
            }

            if (row.sizeId) {
                map.get(row.id).sizes.push({
                    id: row.sizeId,
                    ml: row.ml,
                    price: row.price,
                    stock: row.stock
                });
            }
        });

        res.json(Array.from(map.values()));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi khi lấy danh sách sản phẩm"
        });
    }
});

// THÊM SẢN PHẨM
router.post("/", async (req, res) => {
    try {
        const { code, id, name, image, short, shortDesc, type, brand, sizes } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Tên sản phẩm không được để trống"
            });
        }

        const pool = await poolPromise;

        const productCode = code || id || name.toLowerCase().replace(/\s+/g, "-");
        const description = shortDesc || short || "";

        const productResult = await pool.request()
            .input("code", sql.NVarChar, productCode)
            .input("name", sql.NVarChar, name)
            .input("image", sql.NVarChar, image || "")
            .input("shortDesc", sql.NVarChar, description)
            .input("type", sql.NVarChar, type || "")
            .input("brand", sql.NVarChar, brand || "")
            .query(`
                INSERT INTO Products (code, name, image, shortDesc, type, brand)
                OUTPUT INSERTED.id
                VALUES (@code, @name, @image, @shortDesc, @type, @brand)
            `);

        const productId = productResult.recordset[0].id;

        if (Array.isArray(sizes)) {
            for (const size of sizes) {
                await pool.request()
                    .input("productId", sql.Int, productId)
                    .input("ml", sql.Int, Number(size.ml) || 0)
                    .input("price", sql.Float, Number(size.price) || 0)
                    .input("stock", sql.Int, Number(size.stock) || 0)
                    .query(`
                        INSERT INTO ProductSizes (productId, ml, price, stock)
                        VALUES (@productId, @ml, @price, @stock)
                    `);
            }
        }

        res.status(201).json({
            message: "Thêm sản phẩm thành công",
            productId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi khi thêm sản phẩm"
        });
    }
});

// CẬP NHẬT SẢN PHẨM
router.put("/:id", async (req, res) => {
    try {
        const paramId = req.params.id;
        const { code, name, image, short, shortDesc, type, brand, sizes } = req.body;

        const pool = await poolPromise;

        const findProduct = await pool.request()
            .input("id", sql.NVarChar, paramId)
            .query(`
                SELECT TOP 1 id 
                FROM Products 
                WHERE id = TRY_CONVERT(INT, @id) OR code = @id
            `);

        if (findProduct.recordset.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm"
            });
        }

        const productId = findProduct.recordset[0].id;
        const description = shortDesc || short || "";

        await pool.request()
            .input("productId", sql.Int, productId)
            .input("code", sql.NVarChar, code || paramId)
            .input("name", sql.NVarChar, name || "")
            .input("image", sql.NVarChar, image || "")
            .input("shortDesc", sql.NVarChar, description)
            .input("type", sql.NVarChar, type || "")
            .input("brand", sql.NVarChar, brand || "")
            .query(`
                UPDATE Products
                SET code = @code,
                    name = @name,
                    image = @image,
                    shortDesc = @shortDesc,
                    type = @type,
                    brand = @brand
                WHERE id = @productId
            `);

        await pool.request()
            .input("productId", sql.Int, productId)
            .query("DELETE FROM ProductSizes WHERE productId = @productId");

        if (Array.isArray(sizes)) {
            for (const size of sizes) {
                await pool.request()
                    .input("productId", sql.Int, productId)
                    .input("ml", sql.Int, Number(size.ml) || 0)
                    .input("price", sql.Float, Number(size.price) || 0)
                    .input("stock", sql.Int, Number(size.stock) || 0)
                    .query(`
                        INSERT INTO ProductSizes (productId, ml, price, stock)
                        VALUES (@productId, @ml, @price, @stock)
                    `);
            }
        }

        res.json({
            message: "Cập nhật sản phẩm thành công"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi khi cập nhật sản phẩm"
        });
    }
});

// XÓA SẢN PHẨM
router.delete("/:id", async (req, res) => {
    try {
        const paramId = req.params.id;
        const pool = await poolPromise;

        await pool.request()
            .input("id", sql.NVarChar, paramId)
            .query(`
                DELETE FROM Products 
                WHERE id = TRY_CONVERT(INT, @id) OR code = @id
            `);

        res.json({
            message: "Xóa sản phẩm thành công"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi khi xóa sản phẩm"
        });
    }
});

module.exports = router;