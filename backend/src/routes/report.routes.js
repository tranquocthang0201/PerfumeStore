const express = require("express");
const controller = require("../controllers/report.controller");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", verifyToken, requireAdmin, asyncHandler(controller.dashboard));

module.exports = router;
