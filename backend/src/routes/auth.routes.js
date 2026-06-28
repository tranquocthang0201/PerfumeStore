const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, poolPromise } = require("../config/db");

const router = express.Router();

// ĐĂNG KÝ TÀI KHOẢN
router.post("/register", async (req, res) => {
    try {
        const { fullName, email, password, phone, address } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu"
            });
        }

        const pool = await poolPromise;

        const checkUser = await pool.request()
            .input("email", sql.NVarChar, email)
            .query("SELECT id FROM Users WHERE email = @email");

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({
                message: "Email đã tồn tại"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.request()
            .input("fullName", sql.NVarChar, fullName)
            .input("email", sql.NVarChar, email)
            .input("password", sql.NVarChar, hashedPassword)
            .input("phone", sql.NVarChar, phone || "")
            .input("address", sql.NVarChar, address || "")
            .query(`
                INSERT INTO Users (fullName, email, password, phone, address, role)
                OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.email, INSERTED.phone, INSERTED.address, INSERTED.role
                VALUES (@fullName, @email, @password, @phone, @address, 'user')
            `);

        res.status(201).json({
            message: "Đăng ký thành công",
            user: result.recordset[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi server khi đăng ký"
        });
    }
});

// ĐĂNG NHẬP
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email và mật khẩu"
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("email", sql.NVarChar, email)
            .query("SELECT TOP 1 * FROM Users WHERE email = @email");

        if (result.recordset.length === 0) {
            return res.status(400).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        const user = result.recordset[0];

        let isPasswordValid = false;

        if (user.password && user.password.startsWith("$2")) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        }

        // Cho phép admin mặc định đăng nhập bằng admin123
        if (user.email === "admin@perfume.vn" && password === "admin123") {
            isPasswordValid = true;
        }

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi server khi đăng nhập"
        });
    }
});

module.exports = router;