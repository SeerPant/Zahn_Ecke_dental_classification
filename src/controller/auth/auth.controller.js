import {
  registerUser,
  loginUser,
  getUserById,
  initiateRegistration,
  verifyOtpAndRegister,
  googleAuth,
  googleCompleteRegistration,
  initiateForgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
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

export const initiateRegister = async (req, res, next) => {
  try {
    const result = await initiateRegistration(req.body);

    return successResponse(res, 200, result.message, {});
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { user, token } = await verifyOtpAndRegister(req.body);

    return successResponse(res, 201, "User registered successfully", {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const result = await googleAuth(idToken);

    if (result.isNewUser) {
      return successResponse(res, 200, "New user", {
        isNewUser: true,
        email: result.email,
        name: result.name,
      });
    }

    return successResponse(res, 200, "Logged in successfully", {
      isNewUser: false,
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

export const googleComplete = async (req, res, next) => {
  try {
    const { user, token } = await googleCompleteRegistration(req.body);

    return successResponse(res, 201, "Account created successfully", {
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

export const forgotPasswordInitiate = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      throw error;
    }

    const result = await initiateForgotPassword(email);

    return successResponse(res, 200, result.message, {});
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordVerify = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      const error = new Error("Email and OTP are required");
      error.statusCode = 400;
      throw error;
    }

    const resetToken = await verifyForgotPasswordOtp(email, otp);

    return successResponse(res, 200, "OTP verified successfully", {
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordReset = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      const error = new Error("All fields are required");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error("Password must be at least 6 characters");
      error.statusCode = 400;
      throw error;
    }

    await resetPassword(email, resetToken, newPassword);

    return successResponse(res, 200, "Password reset successfully", {});
  } catch (error) {
    next(error);
  }
};