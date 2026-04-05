import express from "express";
import {
  register,
  login,
  getProfile,
  initiateRegister,
  verifyOtp,
  googleLogin,
  googleComplete,
  forgotPasswordInitiate,
  forgotPasswordVerify,
  forgotPasswordReset,
} from "../../controller/auth/auth.controller.js";
import { validate } from "../../middleware/schemaValidation.js";
import { authenticate } from "../../middleware/jwt.js";
import {
  registerSchema,
  loginSchema,
} from "../../validation/auth.validation.js";

const router = express.Router();

//Public routes
router.post("/register", validate(registerSchema), register);
router.post("/register/initiate", initiateRegister);
router.post("/register/verify", verifyOtp);
router.post("/login", validate(loginSchema), login);
router.post("/google", googleLogin);
router.post("/google/complete", googleComplete);
router.post("/forgot-password/initiate", forgotPasswordInitiate);
router.post("/forgot-password/verify", forgotPasswordVerify);
router.post("/forgot-password/reset", forgotPasswordReset);

//Protected routes
router.get("/profile", authenticate, getProfile); //authenticate checks for token and passes to getProfile

export default router;
