import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .email("Insira um e-mail válido"),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(6, "A senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Nome é obrigatório" })
      .min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z
      .string({ required_error: "E-mail é obrigatório" })
      .email("Insira um e-mail válido"),
    password: z
      .string({ required_error: "Senha é obrigatória" })
      .min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z
      .string({ required_error: "Confirmação de senha é obrigatória" }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Você deve aceitar os termos de uso e política de privacidade",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .email("Insira um e-mail válido"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token inválido"),
    password: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
