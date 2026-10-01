import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getRules, postRule, removeRule } from "./categoryRules.controller.js";

export const categoryRulesRouter = Router();
categoryRulesRouter.use(requireAuth);

categoryRulesRouter.get("/", getRules);
categoryRulesRouter.post("/", postRule);
categoryRulesRouter.delete("/:id", removeRule);
