import express from "express";
import validateMiddleware from "../middlewares/validate.middleware.js"
import authMiddleware from "../middlewares/auth.middleware.js"
import authController from "../controllers/auth.controller.js"
import addressController from "../controllers/address.controller.js"

const router = express.Router();
router.post(
  "/register",
  validateMiddleware.validateRegistration(),
  authController.registerUser
);
router.post(
  "/login",
  validateMiddleware.validateLogin(),
  authController.loginUser
);
router.get(
  "/me",
authMiddleware.authenticateUser,
  authController.getCurrentUser
);
router.post("/logout",authController.logOutCurrentUser)
router.patch("/user/me",authMiddleware.authenticateUser, authController.updateCurrentUser)
router.get("/users/me/addresses",authMiddleware.authenticateUser, addressController.getUserAddress)
router.post("/users/me/addresses",validateMiddleware.validateAddress(),authMiddleware.authenticateUser, addressController.addUserAddress)
router.patch("/users/me/addresses/:addressId",validateMiddleware.validateAddress(),authMiddleware.authenticateUser, addressController.updateUserAddress)
export default router;
