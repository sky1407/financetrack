import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { createCategoryRuleSchema } from "./categoryRules.schema.js";
import { createRule, deleteRule, listRules } from "./categoryRules.service.js";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getRules = catchAsync(async (req: Request, res: Response) => {
  res.json({ rules: await listRules(requireUserId(req)) });
});

/** Responds with the rule and how many uncategorized transactions it recategorized. */
export const postRule = catchAsync(async (req: Request, res: Response) => {
  const input = createCategoryRuleSchema.parse(req.body);
  res.status(201).json(await createRule(requireUserId(req), input));
});

export const removeRule = catchAsync(async (req: Request, res: Response) => {
  await deleteRule(requireUserId(req), req.params.id as string);
  res.status(204).send();
});
