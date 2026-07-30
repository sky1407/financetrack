import { z } from "zod";
import { AccountType } from "@prisma/client";

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Názov účtu je povinný.").max(60),
  type: z.nativeEnum(AccountType).default("BANK"),
  currency: z.string().trim().toUpperCase().length(3, "Mena musí mať 3 znaky (napr. EUR).").default("EUR"),
  initialBalance: z.coerce.number().finite().default(0),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
