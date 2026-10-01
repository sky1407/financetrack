import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { statementContentSchema, type CreateImportQuery } from "./imports.schema.js";
import { createImport, getImport } from "./imports.service.js";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

/** Accepts the raw CSV body; processing happens asynchronously, so the client polls GET /:id. */
export const postImport = catchAsync(async (req: Request, res: Response) => {
  const { accountId, fileName } = res.locals.query as CreateImportQuery;
  const content = statementContentSchema.parse(req.body);
  const batch = await createImport(requireUserId(req), accountId, fileName, content);
  res.status(202).json({ import: batch });
});

export const getImportById = catchAsync(async (req: Request, res: Response) => {
  const batch = await getImport(requireUserId(req), req.params.id as string);
  res.json({ import: batch });
});
