const express = require("express");
const controller = require("../controllers/auth.controller");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", asyncHandler(controller.register));
router.post("/login", asyncHandler(controller.login));
router.get("/me", verifyToken, asyncHandler(controller.me));

module.exports = router;
