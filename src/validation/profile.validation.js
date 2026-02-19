import { z } from "zod";

//validation for updating user profile
export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(1, { message: "Name cannot be empty" })
        .max(100, { message: "Name must be less than 100 characters" })
        .optional(),

      email: z
        .email({ message: "Invalid email format" })
        .max(255, { message: "Email must be less than 255 characters" })
        .optional(),
    })
    .refine((data) => data.name || data.email, {
      message: "At least one field (name or email) must be provided",
    }),
});
