import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../util/password.util.js";
import { generateToken } from "../util/jwt.util.js";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import crypto from "crypto";

const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

//nodemailer transporter using gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//generates 6-digit OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

//hashes OTP before storing
const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

export const initiateRegistration = async (userData) => {
  const { email, password, name } = userData;

  //Checking existing user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error("User with this email already exists");
    error.statusCode = 400;
    throw error;
  }

  //generating and hashing OTP
  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); //10 minutes

  //delete any existing OTP for this email before creating new one
  await prisma.otpToken.deleteMany({ where: { email } });

  //storing hashed OTP
  await prisma.otpToken.create({
    data: { email, otp: hashedOtp, expiresAt },
  });

  //sending OTP email
  await transporter.sendMail({
    from: `"Zahnecke" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Zahnecke verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #0000FF;">Zahnecke</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 8px; color: #0000FF;">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  return { message: "OTP sent to your email" };
};

export const verifyOtpAndRegister = async ({ email, otp, password, name }) => {
  //finding OTP record for this email
  const otpRecord = await prisma.otpToken.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    const error = new Error("No OTP found for this email. Please register again.");
    error.statusCode = 400;
    throw error;
  }

  //checking expiry
  if (new Date() > otpRecord.expiresAt) {
    await prisma.otpToken.deleteMany({ where: { email } });
    const error = new Error("OTP has expired. Please register again.");
    error.statusCode = 400;
    throw error;
  }

  //verifying OTP
  const hashedOtp = hashOtp(otp);
  if (hashedOtp !== otpRecord.otp) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  //cleaning up OTP record
  await prisma.otpToken.deleteMany({ where: { email } });

  //Hashing password
  const hashedPassword = await hashPassword(password);

  //Creating user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      role: "USER",
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

export const googleAuth = async (idToken) => {
  //verifying Google ID token
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_WEB_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name } = payload;

  //checking if user already exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    //block soft-deleted users
    if (user.isDeleted) {
      const error = new Error("This account has been removed");
      error.statusCode = 403;
      throw error;
    }

    //block banned users
    if (user.isBanned) {
      const error = new Error("Your account has been banned");
      error.statusCode = 403;
      throw error;
    }

    //generating token for existing user
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // removing password from response
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token, isNewUser: false };
  }

  //new user — return info for completion screen
  return { isNewUser: true, email, name };
};

export const googleCompleteRegistration = async ({ email, name, password }) => {
  //Checking existing user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error("User with this email already exists");
    error.statusCode = 400;
    throw error;
  }

  //Hashing password
  const hashedPassword = await hashPassword(password);

  //Creating user
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name: name || null, role: "USER" },
    select: { id: true, email: true, name: true, createdAt: true, role: true },
  });

  //generating token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
};

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

  //block soft-deleted users
  if (user.isDeleted) {
    const error = new Error("This account has been removed");
    error.statusCode = 403;
    throw error;
  }

  //block banned users
  if (user.isBanned) {
    const error = new Error("Your account has been banned");
    error.statusCode = 403;
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
    role: user.role,
  });

  // removing password from response
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

export const initiateForgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error("No account found with that email");
    error.statusCode = 400;
    throw error;
  }

  if (user.isDeleted) {
    const error = new Error("This account has been removed");
    error.statusCode = 403;
    throw error;
  }

  if (user.isBanned) {
    const error = new Error("Your account has been banned");
    error.statusCode = 403;
    throw error;
  }

  //delete any existing OTPs for this email
  await prisma.otpToken.deleteMany({ where: { email } });

  //generating and hashing OTP
  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); //10 minutes

  await prisma.otpToken.create({
    data: { email, otp: hashedOtp, expiresAt },
  });

  await transporter.sendMail({
    from: `"Zahnecke" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your Zahnecke password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #0000FF;">Zahnecke</h2>
        <p>Your password reset code is:</p>
        <h1 style="letter-spacing: 8px; color: #0000FF;">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  return { message: "Password reset code sent to your email" };
};

export const verifyForgotPasswordOtp = async (email, otp) => {
  const otpRecord = await prisma.otpToken.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    const error = new Error("No OTP found. Please request a new one");
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > otpRecord.expiresAt) {
    await prisma.otpToken.deleteMany({ where: { email } });
    const error = new Error("OTP has expired. Please request a new one");
    error.statusCode = 400;
    throw error;
  }

  const hashedOtp = hashOtp(otp);
  if (hashedOtp !== otpRecord.otp) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  //OTP verified — delete it and store a reset token in its place
  await prisma.otpToken.deleteMany({ where: { email } });

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = hashOtp(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); //15 minutes

  await prisma.otpToken.create({
    data: { email, otp: hashedResetToken, expiresAt },
  });

  return resetToken;
};

export const resetPassword = async (email, resetToken, newPassword) => {
  const record = await prisma.otpToken.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    const error = new Error("Reset session expired. Please start again");
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > record.expiresAt) {
    await prisma.otpToken.deleteMany({ where: { email } });
    const error = new Error("Reset session expired. Please start again");
    error.statusCode = 400;
    throw error;
  }

  const hashedResetToken = hashOtp(resetToken);
  if (hashedResetToken !== record.otp) {
    const error = new Error("Invalid reset token");
    error.statusCode = 400;
    throw error;
  }

  //cleaning up reset token
  await prisma.otpToken.deleteMany({ where: { email } });

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
};