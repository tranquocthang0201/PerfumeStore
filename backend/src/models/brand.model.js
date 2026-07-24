const { sql, getPool } = require("../config/db");

async function list() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT b.id, b.name, b.slug, b.description, b.logo, b.createdAt, b.updatedAt,
               COUNT(p.id) AS productCount
        FROM Brands b
        LEFT JOIN Products p ON p.brand = b.slug
        GROUP BY b.id, b.name, b.slug, b.description, b.logo, b.createdAt, b.updatedAt
        ORDER BY b.name ASC
    `);

    return result.recordset.map((row) => ({
        ...row,
        productCount: Number(row.productCount || 0)
    }));
}

async function findById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT TOP 1 b.id, b.name, b.slug, b.description, b.logo, b.createdAt, b.updatedAt,
                   (SELECT COUNT(*) FROM Products p WHERE p.brand = b.slug) AS productCount
            FROM Brands b
            WHERE b.id = @id
        `);
    const row = result.recordset[0];
    return row ? { ...row, productCount: Number(row.productCount || 0) } : null;
}

async function findBySlug(slug) {
    const pool = await getPool();
    const result = await pool.request()
        .input("slug", sql.NVarChar(50), slug)
        .query("SELECT TOP 1 id, name, slug, description, logo FROM Brands WHERE slug = @slug");
    return result.recordset[0] || null;
}

async function create(brand) {
    const pool = await getPool();
    const result = await pool.request()
        .input("name", sql.NVarChar(100), brand.name)
        .input("slug", sql.NVarChar(50), brand.slug)
        .input("description", sql.NVarChar(255), brand.description)
        .input("logo", sql.NVarChar(sql.MAX), brand.logo)
        .query(`
            INSERT INTO Brands (name, slug, description, logo)
            OUTPUT INSERTED.id
            VALUES (@name, @slug, @description, @logo)
        `);
    return findById(result.recordset[0].id);
}

async function update(id, brand) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const found = await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .query("SELECT TOP 1 id, slug FROM Brands WITH (UPDLOCK, ROWLOCK) WHERE id = @id");

        const current = found.recordset[0];
        if (!current) {
            await transaction.rollback();
            return null;
        }

        await new sql.Request(transaction)
            .input("oldSlug", sql.NVarChar(50), current.slug)
            .input("newSlug", sql.NVarChar(50), brand.slug)
            .query("UPDATE Products SET brand = @newSlug, updatedAt = GETDATE() WHERE brand = @oldSlug");

        await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .input("name", sql.NVarChar(100), brand.name)
            .input("slug", sql.NVarChar(50), brand.slug)
            .input("description", sql.NVarChar(255), brand.description)
            .input("logo", sql.NVarChar(sql.MAX), brand.logo)
            .query(`
                UPDATE Brands
                SET name = @name, slug = @slug, description = @description,
                    logo = @logo, updatedAt = GETDATE()
                WHERE id = @id
            `);

        await transaction.commit();
        return findById(id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function remove(id) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const found = await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .query("SELECT TOP 1 id, slug FROM Brands WITH (UPDLOCK, ROWLOCK) WHERE id = @id");

        const brand = found.recordset[0];
        if (!brand) {
            await transaction.rollback();
            return { found: false, inUse: false };
        }

        const usage = await new sql.Request(transaction)
            .input("slug", sql.NVarChar(50), brand.slug)
            .query("SELECT COUNT(*) AS productCount FROM Products WHERE brand = @slug");

        if (Number(usage.recordset[0].productCount) > 0) {
            await transaction.rollback();
            return { found: true, inUse: true };
        }

        await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .query("DELETE FROM Brands WHERE id = @id");

        await transaction.commit();
        return { found: true, inUse: false };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = { list, findById, findBySlug, create, update, remove };
