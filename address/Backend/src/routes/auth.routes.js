import express from "express";
import createAuthMiddleware from "../middlewares/auth.middleware.js";
import { createAddressValidator } from "../validators/address.validate.js";
import addressController from "../controllers/address.controller.js";

const router = express.Router();

router.post(
  "/create-address",
  createAuthMiddleware(["user"]),
  createAddressValidator,
  addressController.createAddress
);

router.get(
  "/address",
  createAuthMiddleware(["seller", "user"]),
  addressController.getAddress
);
export default router;