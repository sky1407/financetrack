import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateQuery } from "../../middleware/validate.js";
import { listBudgetsQuerySchema } from "./budgets.schema.js";
import { getBudgets, patchBudget, postBudget, removeBudget } from "./budgets.controller.js";

export const budgetsRouter = Router();
budgetsRouter.use(requireAuth);

budgetsRouter.get("/", validateQuery(listBudgetsQuerySchema), getBudgets);
budgetsRouter.post("/", postBudget);
budgetsRouter.patch("/:id", patchBudget);
budgetsRouter.delete("/:id", removeBudget);
