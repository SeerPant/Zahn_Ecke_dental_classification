import { z } from "zod";

// Define Role enum
export const RoleEnum = z.enum(["USER", "ADMIN"]);

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please provide a valid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" }),
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long" })
      .max(50, { message: "Name cannot exceed 50 characters" })
      .optional(),
    role: RoleEnum.optional().default("USER"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please provide a valid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
  }),
});
