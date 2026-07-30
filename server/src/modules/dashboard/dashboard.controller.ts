import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import type { DashboardQuery } from "./dashboard.schema.js";
import { getDashboardSummary } from "./dashboard.service.js";

export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const query = res.locals.query as DashboardQuery;
  const summary = await getDashboardSummary(req.user.userId, query);
  res.json({ summary });
});
