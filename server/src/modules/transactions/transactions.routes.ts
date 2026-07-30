import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateQuery } from "../../middleware/validate.js";
import { listTransactionsQuerySchema } from "./transactions.schema.js";
import { getTransactions, patchTransaction, postTransaction, removeTransaction } from "./transactions.controller.js";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

transactionsRouter.get("/", validateQuery(listTransactionsQuerySchema), getTransactions);
transactionsRouter.post("/", postTransaction);
transactionsRouter.patch("/:id", patchTransaction);
transactionsRouter.delete("/:id", removeTransaction);
