const { sql, getPool } = require("../config/db");

async function list() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT c.id, c.name, c.slug, c.description, c.createdAt, c.updatedAt,
               COUNT(p.id) AS productCount
        FROM Categories c
        LEFT JOIN Products p ON p.type = c.slug
        GROUP BY c.id, c.name, c.slug, c.description, c.createdAt, c.updatedAt
        ORDER BY c.name ASC
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
            SELECT TOP 1 c.id, c.name, c.slug, c.description, c.createdAt, c.updatedAt,
                   (SELECT COUNT(*) FROM Products p WHERE p.type = c.slug) AS productCount
            FROM Categories c
            WHERE c.id = @id
        `);
    const row = result.recordset[0];
    return row ? { ...row, productCount: Number(row.productCount || 0) } : null;
}

async function findBySlug(slug) {
    const pool = await getPool();
    const result = await pool.request()
        .input("slug", sql.NVarChar(50), slug)
        .query("SELECT TOP 1 id, name, slug, description FROM Categories WHERE slug = @slug");
    return result.recordset[0] || null;
}

async function create(category) {
    const pool = await getPool();
    const result = await pool.request()
        .input("name", sql.NVarChar(100), category.name)
        .input("slug", sql.NVarChar(50), category.slug)
        .input("description", sql.NVarChar(255), category.description)
        .query(`
            INSERT INTO Categories (name, slug, description)
            OUTPUT INSERTED.id
            VALUES (@name, @slug, @description)
        `);
    return findById(result.recordset[0].id);
}

async function update(id, category) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const found = await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .query("SELECT TOP 1 id, slug FROM Categories WITH (UPDLOCK, ROWLOCK) WHERE id = @id");

        const current = found.recordset[0];
        if (!current) {
            await transaction.rollback();
            return null;
        }

        await new sql.Request(transaction)
            .input("oldSlug", sql.NVarChar(50), current.slug)
            .input("newSlug", sql.NVarChar(50), category.slug)
            .query("UPDATE Products SET type = @newSlug, updatedAt = GETDATE() WHERE type = @oldSlug");

        await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .input("name", sql.NVarChar(100), category.name)
            .input("slug", sql.NVarChar(50), category.slug)
            .input("description", sql.NVarChar(255), category.description)
            .query(`
                UPDATE Categories
                SET name = @name, slug = @slug, description = @description, updatedAt = GETDATE()
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
            .query("SELECT TOP 1 id, slug FROM Categories WITH (UPDLOCK, ROWLOCK) WHERE id = @id");

        const category = found.recordset[0];
        if (!category) {
            await transaction.rollback();
            return { found: false, inUse: false };
        }

        const usage = await new sql.Request(transaction)
            .input("slug", sql.NVarChar(50), category.slug)
            .query("SELECT COUNT(*) AS productCount FROM Products WHERE type = @slug");

        if (Number(usage.recordset[0].productCount) > 0) {
            await transaction.rollback();
            return { found: true, inUse: true };
        }

        await new sql.Request(transaction)
            .input("id", sql.Int, id)
            .query("DELETE FROM Categories WHERE id = @id");

        await transaction.commit();
        return { found: true, inUse: false };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = { list, findById, findBySlug, create, update, remove };
