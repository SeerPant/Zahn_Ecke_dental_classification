import { verifyToken } from "../util/jwt.util.js";
import { errorResponse } from "../util/response.util.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "No token provided");
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);
    req.user = decoded;
    d;
    next();
  } catch (error) {
    return errorResponse(res, 401, "Invalid or expired token");
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, 401, "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    return errorResponse(res, 401, "Token expired");
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return errorResponse(res, statusCode, message);
};
