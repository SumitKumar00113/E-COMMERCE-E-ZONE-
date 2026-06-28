import express from "express";
import orderController from "../controllers/order.controller.js";

// =========================
// Order Routes
// =========================
const router = express.Router();
router.post(["/orders", "/order"], orderController.createOrder);

export default router;
