import express from "express";

import {
  changePassword,
  deleteAccount,
  updateProfile,
  getProfile,
} from "../../controller/user/user.controller.js";

import { authenticate } from "../../middleware/jwt.js";
import { validate } from "../../middleware/schemaValidation.js";
import {
  changePasswordSchema,
  deleteAccountSchema,
} from "../../validation/password.validation.js";

const router = express.Router();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);
router.delete(
  "/account",
  authenticate,
  validate(deleteAccountSchema),
  deleteAccount,
);

export default router;
