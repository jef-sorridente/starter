import { z } from "zod";
import { passwordSchema } from "./auth";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export interface ProfileMe {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null; // ISO date
}
