import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import routes from "./route/index.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "*",
  }),
);

app.use(cookieParser());
app.use(express.json());

app.use("/api", routes);

//global error handling
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;
