import express from "express";
import validateMiddleware from "../middlewares/validate.middleware.js"
import authMiddleware from "../middlewares/auth.middleware.js"
import authController from "../controllers/auth.controller.js"


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
export default router;
