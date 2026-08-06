const express = require("express");
const controller = require("../controllers/product.controller");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.get("/:id", asyncHandler(controller.getById));
router.post("/", verifyToken, requireAdmin, asyncHandler(controller.create));
router.put("/:id", verifyToken, requireAdmin, asyncHandler(controller.update));
router.delete("/:id", verifyToken, requireAdmin, asyncHandler(controller.remove));

module.exports = router;
