import express from "express";
import createAuthMiddleware from "../middlewares/auth.middleware.js";
import cartController from "../controllers/cart.controller.js";
import cartValidation from "../validators/auth.validator.js";

const router = express.Router();

router.get("/",createAuthMiddleware(["seller","user"]),cartController.getCartItems);
router.post(
  "/items",
  createAuthMiddleware(["seller","user"]),
  cartValidation.itemCartValidation(),
  cartController.addItemToCart,
);
router.delete(
  "/clear",
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
