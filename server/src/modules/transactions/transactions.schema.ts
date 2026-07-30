import { z } from "zod";
import { TransactionType } from "@prisma/client";

export const createTransactionSchema = z.object({
  accountId: z.string().cuid("Neplatné ID účtu."),
  categoryId: z.string().cuid("Neplatné ID kategórie."),
  type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().positive("Suma musí byť kladné číslo."),
  note: z.string().trim().max(200).optional(),
  date: z.coerce.date(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const listTransactionsQuerySchema = z.object({
  accountId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
