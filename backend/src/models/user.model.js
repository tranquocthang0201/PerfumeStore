const { sql, getPool } = require("../config/db");

async function findByEmail(email) {
    const pool = await getPool();
    const result = await pool.request()
        .input("email", sql.NVarChar(100), email)
        .query(`
            SELECT TOP 1 id, fullName, email, password, phone, address, role, createdAt
            FROM Users
            WHERE email = @email
        `);
    return result.recordset[0] || null;
}

async function findById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT TOP 1 id, fullName, email, phone, address, role, createdAt
            FROM Users
            WHERE id = @id
        `);
    return result.recordset[0] || null;
}

async function create({ fullName, email, passwordHash, phone, address, role = "user" }) {
    const pool = await getPool();
    const result = await pool.request()
        .input("fullName", sql.NVarChar(100), fullName)
        .input("email", sql.NVarChar(100), email)
        .input("password", sql.NVarChar(255), passwordHash)
        .input("phone", sql.NVarChar(20), phone)
        .input("address", sql.NVarChar(255), address)
        .input("role", sql.NVarChar(20), role)
        .query(`
            INSERT INTO Users (fullName, email, password, phone, address, role)
            OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.email, INSERTED.phone,
                   INSERTED.address, INSERTED.role, INSERTED.createdAt
            VALUES (@fullName, @email, @password, @phone, @address, @role)
        `);
    return result.recordset[0];
}

async function list() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT id, fullName, email, phone, address, role,
               CONVERT(VARCHAR(10), createdAt, 103) AS createdAt
        FROM Users
        ORDER BY id DESC
    `);
    return result.recordset;
}

async function updateProfile(id, { fullName, phone, address }) {
    const pool = await getPool();
    const result = await pool.request()
        .input("id", sql.Int, id)
        .input("fullName", sql.NVarChar(100), fullName)
        .input("phone", sql.NVarChar(20), phone)
        .input("address", sql.NVarChar(255), address)
        .query(`
            UPDATE Users
            SET fullName = @fullName, phone = @phone, address = @address
            OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.email, INSERTED.phone,
                   INSERTED.address, INSERTED.role, INSERTED.createdAt
            WHERE id = @id
        `);
    return result.recordset[0] || null;
}

module.exports = { findByEmail, findById, create, list, updateProfile };
