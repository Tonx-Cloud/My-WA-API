import { z } from 'zod';

// User authentication and profile schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email invÃ¡lido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
    name: z.string().min(1, 'Nome Ã© obrigatÃ³rio').max(100),
    terms: z.boolean().refine(val => val === true, 'Aceitar os termos Ã© obrigatÃ³rio'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email invÃ¡lido'),
    password: z.string().min(1, 'Senha Ã© obrigatÃ³ria'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Email invÃ¡lido'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    current_password: z.string().min(6).optional(),
    new_password: z.string().min(6).max(100).optional(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token Ã© obrigatÃ³rio'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  }),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
