import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { createCategorySchema, updateCategorySchema } from "./categories.schema.js";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./categories.service.js";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await listCategories(requireUserId(req));
  res.json({ categories });
});

export const postCategory = catchAsync(async (req: Request, res: Response) => {
  const input = createCategorySchema.parse(req.body);
  const category = await createCategory(requireUserId(req), input);
  res.status(201).json({ category });
});

export const patchCategory = catchAsync(async (req: Request, res: Response) => {
  const input = updateCategorySchema.parse(req.body);
  const category = await updateCategory(requireUserId(req), req.params.id as string, input);
  res.json({ category });
});

export const removeCategory = catchAsync(async (req: Request, res: Response) => {
  await deleteCategory(requireUserId(req), req.params.id as string);
  res.status(204).send();
});
