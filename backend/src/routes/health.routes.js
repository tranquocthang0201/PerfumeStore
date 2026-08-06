const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { getPool } = require("../config/db");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
}));

module.exports = router;
