import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../util/password.util.js";
import { generateToken } from "../util/jwt.util.js";

export const registerUser = async (userData) => {
  const { email, password, name } = userData;

  //Checking existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error("User with this email already exists");
    error.statusCode = 400;
    throw error;
  }

  //Hashing password
  const hashedPassword = await hashPassword(password);

  //Creating user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      role: userData.role || "USER",
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      role: true,
    },
  });

  //generating token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
};

export const loginUser = async (credentials) => {
  const { email, password } = credentials;

  //user through email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  //verifying password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
  });

  //removing password from response
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

export const getUserById = async (userId) => {
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
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};
