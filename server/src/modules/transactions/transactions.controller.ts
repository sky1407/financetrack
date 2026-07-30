import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { createTransactionSchema, updateTransactionSchema, type ListTransactionsQuery } from "./transactions.schema.js";
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from "./transactions.service.js";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const query = res.locals.query as ListTransactionsQuery;
  const result = await listTransactions(requireUserId(req), query);
  res.json(result);
});

export const postTransaction = catchAsync(async (req: Request, res: Response) => {
  const input = createTransactionSchema.parse(req.body);
  const transaction = await createTransaction(requireUserId(req), input);
  res.status(201).json({ transaction });
});

export const patchTransaction = catchAsync(async (req: Request, res: Response) => {
  const input = updateTransactionSchema.parse(req.body);
  const transaction = await updateTransaction(requireUserId(req), req.params.id as string, input);
  res.json({ transaction });
});

export const removeTransaction = catchAsync(async (req: Request, res: Response) => {
  await deleteTransaction(requireUserId(req), req.params.id as string);
  res.status(204).send();
});
