import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getAccounts, patchAccount, postAccount, removeAccount } from "./accounts.controller.js";

export const accountsRouter = Router();
accountsRouter.use(requireAuth);

accountsRouter.get("/", getAccounts);
accountsRouter.post("/", postAccount);
accountsRouter.patch("/:id", patchAccount);
accountsRouter.delete("/:id", removeAccount);
