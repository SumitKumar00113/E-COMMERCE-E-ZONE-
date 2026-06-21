import express from "express";
import multer from "multer";
import productController from "../controllers/product.controller.js";
import validateMiddleware from "../middlewares/validate.middleware.js";
import createAuthMiddleware from "../middlewares/auth.middleware.js";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.post(
  "/product",
  upload.array("images", 5),
  createAuthMiddleware(["admin", "seller"]),
  validateMiddleware.validateProduct,
  productController.createProduct,
);
router.get(
  "/product/seller-products",
  createAuthMiddleware(["seller"]),
  productController.getProductsBySeller,
);
router.get("/product/search", productController.getProductsBySearch);
router.patch(
  "/product/:id",
  upload.array("images", 5),
  createAuthMiddleware(["admin", "seller"]),
  productController.updateProduct,
);
router.delete(
  "/product/:id",
  createAuthMiddleware(["admin", "seller"]),
  productController.deleteProduct,
);
router.get(
  "/product/:id",
  createAuthMiddleware(["admin", "seller"]),
  productController.getProducts,
);
export default router;
