import express from "express";
import authRoutes from "./auth/index.js";

const router = express.Router();

//Connecting all auth routes here
router.use("/auth", authRoutes);

export default router;
