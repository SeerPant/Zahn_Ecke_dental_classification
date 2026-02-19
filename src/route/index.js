import express from "express";
import authRoutes from "./auth/index.js";
import userRoutes from "./user/index.js";

const router = express.Router();
//health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "APIs are working",
    timestamp: new Date().toISOString(),
  });
});
//Connecting all auth routes here
router.use("/auth", authRoutes);

//user routes
router.use("/user", userRoutes);

export default router;
