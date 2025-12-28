import express from "express";
import {
  register,
  login,
  getProfile,
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
router.post("/login", validate(loginSchema), login);

//Protected routes
router.get("/profile", authenticate, getProfile); //here, authenticate is checking for token and passes to getProfile

export default router;
