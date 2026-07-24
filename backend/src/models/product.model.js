const { sql, getPool } = require("../config/db");

function mapRows(rows) {
    const products = new Map();

    for (const row of rows) {
        if (!products.has(row.id)) {
            products.set(row.id, {
                id: row.code || String(row.id),
                dbId: row.id,
                code: row.code,
                name: row.name,
                image: row.image || "",
                short: row.shortDesc || "",
                shortDesc: row.shortDesc || "",
                type: row.type || "",
                brand: row.brand || "",
                discount: Number(row.discount || 0),
                isNew: Boolean(row.isNew),
                isFeatured: Boolean(row.isFeatured),
                createdAt: row.createdAt || null,
                updatedAt: row.updatedAt || null,
                sizes: []
            });
        }

        if (row.sizeId) {
            products.get(row.id).sizes.push({
                id: row.sizeId,
                ml: row.ml,
                price: Number(row.price),
                stock: row.stock
            });
        }
    }

    return Array.from(products.values());
}

async function list({ brand, type, search } = {}) {
    const pool = await getPool();
    const request = pool.request()
        .input("brand", sql.NVarChar(50), brand || null)
        .input("type", sql.NVarChar(50), type || null)
        .input("search", sql.NVarChar(150), search ? `%${search}%` : null);

    const result = await request.query(`
        SELECT p.id, p.code, p.name, p.image, p.shortDesc, p.type, p.brand,
               p.discount, p.isNew, p.isFeatured, p.createdAt, p.updatedAt,
               s.id AS sizeId, s.ml, s.price, s.stock
        FROM Products p
        LEFT JOIN ProductSizes s ON p.id = s.productId
        WHERE (@brand IS NULL OR p.brand = @brand)
          AND (@type IS NULL OR p.type = @type)
          AND (@search IS NULL OR p.name LIKE @search OR p.shortDesc LIKE @search)
        ORDER BY p.id DESC, s.ml ASC
    `);

    return mapRows(result.recordset);
}

async function findByIdentifier(identifier) {
    const pool = await getPool();
    const result = await pool.request()
        .input("identifier", sql.NVarChar(100), String(identifier))
        .query(`
            SELECT p.id, p.code, p.name, p.image, p.shortDesc, p.type, p.brand,
                   p.discount, p.isNew, p.isFeatured, p.createdAt, p.updatedAt,
                   s.id AS sizeId, s.ml, s.price, s.stock
            FROM Products p
            LEFT JOIN ProductSizes s ON p.id = s.productId
            WHERE p.id = TRY_CONVERT(INT, @identifier) OR p.code = @identifier
            ORDER BY s.ml ASC
        `);

    return mapRows(result.recordset)[0] || null;
}

async function create(product) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const inserted = await new sql.Request(transaction)
            .input("code", sql.NVarChar(50), product.code)
            .input("name", sql.NVarChar(150), product.name)
            .input("image", sql.NVarChar(255), product.image)
            .input("shortDesc", sql.NVarChar(255), product.shortDesc)
            .input("type", sql.NVarChar(50), product.type)
            .input("brand", sql.NVarChar(50), product.brand)
            .input("discount", sql.Int, product.discount)
            .input("isNew", sql.Bit, product.isNew)
            .input("isFeatured", sql.Bit, product.isFeatured)
            .query(`
                INSERT INTO Products (code, name, image, shortDesc, type, brand, discount, isNew, isFeatured)
                OUTPUT INSERTED.id
                VALUES (@code, @name, @image, @shortDesc, @type, @brand, @discount, @isNew, @isFeatured)
            `);

        const productId = inserted.recordset[0].id;
        for (const size of product.sizes) {
            await new sql.Request(transaction)
                .input("productId", sql.Int, productId)
                .input("ml", sql.Int, size.ml)
                .input("price", sql.Decimal(18, 2), size.price)
                .input("stock", sql.Int, size.stock)
                .query(`
                    INSERT INTO ProductSizes (productId, ml, price, stock)
                    VALUES (@productId, @ml, @price, @stock)
                `);
        }

        await transaction.commit();
        return findByIdentifier(productId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function update(identifier, product) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const found = await new sql.Request(transaction)
            .input("identifier", sql.NVarChar(100), String(identifier))
            .query(`
                SELECT TOP 1 id FROM Products
                WHERE id = TRY_CONVERT(INT, @identifier) OR code = @identifier
            `);

        if (!found.recordset[0]) {
            await transaction.rollback();
            return null;
        }

        const productId = found.recordset[0].id;
        await new sql.Request(transaction)
            .input("id", sql.Int, productId)
            .input("code", sql.NVarChar(50), product.code)
            .input("name", sql.NVarChar(150), product.name)
            .input("image", sql.NVarChar(255), product.image)
            .input("shortDesc", sql.NVarChar(255), product.shortDesc)
            .input("type", sql.NVarChar(50), product.type)
            .input("brand", sql.NVarChar(50), product.brand)
            .input("discount", sql.Int, product.discount)
            .input("isNew", sql.Bit, product.isNew)
            .input("isFeatured", sql.Bit, product.isFeatured)
            .query(`
                UPDATE Products
                SET code = @code, name = @name, image = @image, shortDesc = @shortDesc,
                    type = @type, brand = @brand, discount = @discount,
                    isNew = @isNew, isFeatured = @isFeatured, updatedAt = GETDATE()
                WHERE id = @id
            `);

        await new sql.Request(transaction)
            .input("productId", sql.Int, productId)
            .query("DELETE FROM ProductSizes WHERE productId = @productId");

        for (const size of product.sizes) {
            await new sql.Request(transaction)
                .input("productId", sql.Int, productId)
                .input("ml", sql.Int, size.ml)
                .input("price", sql.Decimal(18, 2), size.price)
                .input("stock", sql.Int, size.stock)
                .query(`
                    INSERT INTO ProductSizes (productId, ml, price, stock)
                    VALUES (@productId, @ml, @price, @stock)
                `);
        }

        await transaction.commit();
        return findByIdentifier(productId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function remove(identifier) {
    const pool = await getPool();
    const result = await pool.request()
        .input("identifier", sql.NVarChar(100), String(identifier))
        .query(`
            DELETE FROM Products
            OUTPUT DELETED.id
            WHERE id = TRY_CONVERT(INT, @identifier) OR code = @identifier
        `);
    return Boolean(result.recordset[0]);
}

module.exports = { list, findByIdentifier, create, update, remove, mapRows };
