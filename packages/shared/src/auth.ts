import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isPasswordDenylisted } from "./password-policy";

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `Senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`)
  .refine((pw) => !isPasswordDenylisted(pw), {
    message: "Senha muito fraca — evite sequências óbvias, repetições ou o nome do app",
  });

export const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface Profile {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  profile: Profile;
}

export interface Session {
  id: string;
  userAgent: string | null;
  createdAt: string; // ISO date
  expiresAt: string; // ISO date
}
