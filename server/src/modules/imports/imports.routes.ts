import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth.js";
import { validateQuery } from "../../middleware/validate.js";
import { getImportById, postImport } from "./imports.controller.js";
import { MAX_STATEMENT_BYTES, createImportQuerySchema } from "./imports.schema.js";

export const importsRouter = Router();
importsRouter.use(requireAuth);

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth runs before the body parser, so anonymous clients cannot make the server buffer uploads.
importsRouter.post(
  "/",
  uploadLimiter,
  validateQuery(createImportQuerySchema),
  express.text({ type: ["text/csv", "text/plain"], limit: MAX_STATEMENT_BYTES }),
  postImport
);
importsRouter.get("/:id", getImportById);
