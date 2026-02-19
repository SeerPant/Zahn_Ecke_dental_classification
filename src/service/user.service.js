import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../util/password.util.js";

//changing user password
export const changeUserPassword = async (userId, oldPassword, newPassword) => {
  //finding user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  //verifying old password
  const isPasswordValid = await comparePassword(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  //hasing new password
  const hashedPassword = await hashPassword(newPassword);

  //update password
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

//detelting user account
export const deleteUserAccount = async (userId, password) => {
  //finding user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("user not found");
  }

  //verifying password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Password is incorrect");
  }

  //delete user
  const deletedUser = await prisma.user.delete({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  return deletedUser;
};

//updating user profile
export const updateUserProfile = async (userId, updateData) => {
  const { name, email } = updateData;

  //check if email is being changed and if it is alreay present
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId,
        },
      },
    });

    if (existingUser) {
      throw new Error("Email is already in use");
    }
  }

  //update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return updatedUser;
};

//getting user profile

export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
