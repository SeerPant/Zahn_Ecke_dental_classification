import {
  changeUserPassword,
  deleteUserAccount,
  updateUserProfile,
  getUserProfile,
} from "../../service/user.service.js";

import { successResponse, errorResponse } from "../../util/response.util.js";

//change user password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const updatedUser = await changeUserPassword(
      userId,
      oldPassword,
      newPassword,
    );

    return successResponse(
      res,
      200,
      "Password changed successfully",
      updatedUser,
    );
  } catch (error) {
    console.error("change password error:", error);

    if (error.message === "Current password is incorrect") {
      return errorResponse(res, 401, "Current password is incorrect");
    }

    if (error.message === "User not found") {
      return errorResponse(res, 404, "User not found");
    }

    return errorResponse(res, 500, "Failed to change password");
  }
};

//deleting user account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    const deletedUser = await deleteUserAccount(userId, password);

    return successResponse(res, 200, "Account deleted successfully", {
      id: deletedUser.id,
      email: deletedUser.email,
    });
  } catch (error) {
    console.error("Delete account error:", error);

    if (error.message === "Password is incorrect") {
      return errorResponse(res, 401, "Password is incorrect");
    }

    if (error.message === "User not found") {
      return errorResponse(res, 404, "User not found");
    }

    return errorResponse(res, 500, "Failed to delete account");
  }
};

//update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const updatedUser = await updateUserProfile(userId, { name, email });

    return successResponse(
      res,
      200,
      "Profile updated successfully",
      updatedUser,
    );
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.message === "Email already in use") {
      return errorResponse(res, 409, "Email already in use");
    }

    if (error.message === "User not found") {
      return errorResponse(res, 404, "User not found");
    }

    return errorResponse(res, 500, "Failed to update profile");
  }
};

//getting user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await getUserProfile(userId);

    return successResponse(res, 200, "Profile retrieved successfully", user);
  } catch (error) {
    console.error("Get profile error:", error);

    if (error.message === "User not found") {
      return errorResponse(res, 404, "User not found");
    }

    return errorResponse(res, 500, "Failed to get profile");
  }
};
