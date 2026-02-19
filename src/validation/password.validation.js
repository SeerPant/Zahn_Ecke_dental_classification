import { z } from "zod";

//validation for changing password
export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z
        .string({
          required_error: "Old password is required",
        })
        .min(1, { message: "Old password cannot be empty" }),

      newPassword: z
        .string({
          required_error: "New password is required",
        })
        .min(6, { message: "New password must be at least 6 characters long" })
        .max(100, { message: "New password must be less than 100 characters" }),

      confirmPassword: z
        .string({
          required_error: "Password confirmation is required",
        })
        .min(1, { message: "Password confirmation cannot be empty" }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
      message: "New password must be different from old password",
      path: ["newPassword"],
    }),
});

//validation for deleting account
export const deleteAccountSchema = z.object({
  body: z.object({
    password: z
      .string({
        required_error: "Password is required to delete account",
      })
      .min(1, { message: "Password cannot be empty" }),

    confirmDeletion: z.literal(true, {
      errorMap: () => ({ message: "You must confirm account deletion" }),
    }),
  }),
});
