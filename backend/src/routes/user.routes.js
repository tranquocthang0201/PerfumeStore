const express = require("express");
const { poolPromise } = require("../config/db");

const router = express.Router();

// LẤY DANH SÁCH NGƯỜI DÙNG
router.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT 
                id,
                fullName,
                email,
                phone,
                address,
                role,
                CONVERT(VARCHAR(10), createdAt, 103) AS createdAt
            FROM Users
            ORDER BY id DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi khi lấy danh sách người dùng"
        });
    }
});

module.exports = router;