import express from "express";
import createAuthMiddleware from "../middlewares/auth.middleware.js";
import cartController from "../controllers/cart.controller.js";
import cartValidation from "../validators/auth.validator.js";

const router = express.Router();

router.get("/", createAuthMiddleware(["user"]), cartController.getCartItems);
router.post(
  "/items",
  createAuthMiddleware(["user"]),
  cartValidation.itemCartValidation(),
  cartController.addItemToCart,
);
router.delete(
  "/",
  createAuthMiddleware(["user"]),
  cartController.deleteAllCart,
);
router.patch(
  "/items/:productId",
  createAuthMiddleware(["user"]),
  cartValidation.updateCartItemValidation(),
  cartController.updateCartItem,
);
router.delete(
  "/items/:productId",
  createAuthMiddleware(["user"]),
  cartController.deleteCartItem,
);

export default router;
