import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { createBudgetSchema, updateBudgetSchema, type ListBudgetsQuery } from "./budgets.schema.js";
import { createBudget, deleteBudget, listBudgets, updateBudget } from "./budgets.service.js";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getBudgets = catchAsync(async (req: Request, res: Response) => {
  const query = res.locals.query as ListBudgetsQuery;
  const budgets = await listBudgets(requireUserId(req), query);
  res.json({ budgets });
});

export const postBudget = catchAsync(async (req: Request, res: Response) => {
  const input = createBudgetSchema.parse(req.body);
  const budget = await createBudget(requireUserId(req), input);
  res.status(201).json({ budget });
});

export const patchBudget = catchAsync(async (req: Request, res: Response) => {
  const input = updateBudgetSchema.parse(req.body);
  const budget = await updateBudget(requireUserId(req), req.params.id as string, input);
  res.json({ budget });
});

export const removeBudget = catchAsync(async (req: Request, res: Response) => {
  await deleteBudget(requireUserId(req), req.params.id as string);
  res.status(204).send();
});
