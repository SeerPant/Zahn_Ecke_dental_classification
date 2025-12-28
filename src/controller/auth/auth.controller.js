import {
  registerUser,
  loginUser,
  getUserById,
} from "../../service/auth.service.js";
import { successResponse } from "../../util/response.util.js";

export const register = async (req, res, next) => {
  try {
    const { user, token } = await registerUser(req.body);

    return successResponse(res, 201, "User registered successfully", {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, token } = await loginUser(req.body);

    return successResponse(res, 200, "sucessfully logged in", {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);

    return successResponse(res, 200, "Profile retrieved successfully", {
      user,
    });
  } catch (error) {
    next(error);
  }
};
