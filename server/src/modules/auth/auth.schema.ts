import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Meno musí mať aspoň 2 znaky.").max(80),
  email: z.string().trim().toLowerCase().email("Zadaj platný e-mail."),
  password: z.string().min(8, "Heslo musí mať aspoň 8 znakov.").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Zadaj platný e-mail."),
  password: z.string().min(1, "Zadaj heslo."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
