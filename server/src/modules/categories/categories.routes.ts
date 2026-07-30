import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getCategories, patchCategory, postCategory, removeCategory } from "./categories.controller.js";

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

categoriesRouter.get("/", getCategories);
categoriesRouter.post("/", postCategory);
categoriesRouter.patch("/:id", patchCategory);
categoriesRouter.delete("/:id", removeCategory);
