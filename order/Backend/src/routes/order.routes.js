import express from "express";
import orderController from "../controllers/order.controller.js";
import createAuthMiddleware from "../middlewares/order.middleware.js";
// =========================
// Order Routes
// =========================
const router = express.Router();
router.post(
  ["/orders", "/order"],
  createAuthMiddleware(["user", "seller"]),
  orderController.createOrder,
);
router.get(
  "/orders/me",
  createAuthMiddleware(["user", "seller"]),
  orderController.getPaginatedOrders,
);
router.get(
  "/orders/:id",
  createAuthMiddleware(["user"]),
  orderController.getOrder,
);
router.post("/orders/:id/cancel",createAuthMiddleware(["user"],orderController.cancelOrder))
router.patch("/orders/:id/address",createAuthMiddleware(["user"]),orderController.updateAddressOfOrder)
export default router;
