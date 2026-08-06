const express = require("express");
const controller = require("../controllers/order.controller");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", verifyToken, asyncHandler(controller.listMine));
router.get("/", verifyToken, requireAdmin, asyncHandler(controller.list));
router.get("/:id", verifyToken, asyncHandler(controller.getById));
router.post("/", verifyToken, asyncHandler(controller.create));
router.patch("/:id/status", verifyToken, requireAdmin, asyncHandler(controller.updateStatus));
router.patch("/:id/cancel", verifyToken, asyncHandler(controller.cancelMine));

module.exports = router;
