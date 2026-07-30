import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateQuery } from "../../middleware/validate.js";
import { dashboardQuerySchema } from "./dashboard.schema.js";
import { getDashboard } from "./dashboard.controller.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", validateQuery(dashboardQuerySchema), getDashboard);
