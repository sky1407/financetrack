import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { createAccountSchema, updateAccountSchema } from "./accounts.schema.js";
import { createAccount, deleteAccount, listAccounts, updateAccount } from "./accounts.service.js";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getAccounts = catchAsync(async (req: Request, res: Response) => {
  const accounts = await listAccounts(requireUserId(req));
  res.json({ accounts });
});

export const postAccount = catchAsync(async (req: Request, res: Response) => {
  const input = createAccountSchema.parse(req.body);
  const account = await createAccount(requireUserId(req), input);
  res.status(201).json({ account });
});

export const patchAccount = catchAsync(async (req: Request, res: Response) => {
  const input = updateAccountSchema.parse(req.body);
  const account = await updateAccount(requireUserId(req), req.params.id as string, input);
  res.json({ account });
});

export const removeAccount = catchAsync(async (req: Request, res: Response) => {
  await deleteAccount(requireUserId(req), req.params.id as string);
  res.status(204).send();
});
