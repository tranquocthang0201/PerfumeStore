const express = require("express");
const controller = require("../controllers/user.controller");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, requireAdmin, asyncHandler(controller.list));
router.put("/me", verifyToken, asyncHandler(controller.updateMe));

module.exports = router;
