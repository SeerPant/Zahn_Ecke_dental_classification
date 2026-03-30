import express from "express";
import {
  getUsersController,
  toggleBanController,
  deleteUserController,
} from "../../controller/admin/admin.controller.js";
import { authenticate } from "../../middleware/jwt.js";

const router = express.Router();

//require admin role for all admin routes
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  next();
};

router.use(authenticate, requireAdmin);

//GET
router.get("/users", getUsersController);

//PATCH toggles ban/unban
router.patch("/users/:id/ban", toggleBanController);

//DELETE
router.delete("/users/:id", deleteUserController);

export default router;
