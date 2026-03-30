import {
  getUsers,
  toggleBanUser,
  softDeleteUser,
} from "../../service/admin.service.js";
import { successResponse } from "../../util/response.util.js";

export const getUsersController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    const filter = req.query.filter || "all"; // all

    const result = await getUsers({ page, limit, search, filter });

    return successResponse(res, 200, "Users retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const toggleBanController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await toggleBanUser(id);

    const message = user.isBanned
      ? "User banned successfully"
      : "User unbanned successfully";

    return successResponse(res, 200, message, { user });
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await softDeleteUser(id);

    return successResponse(res, 200, "User removed successfully", { user });
  } catch (error) {
    next(error);
  }
};