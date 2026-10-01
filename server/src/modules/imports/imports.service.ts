import { UnrecoverableError, type Job } from "bullmq";
import { AccountType, CategoryType, ImportStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { UNCATEGORIZED } from "../categories/categories.constants.js";
import { matchCategory } from "../categoryRules/categoryRules.matcher.js";
import { loadMatchableRules } from "../categoryRules/categoryRules.service.js";
import { AppError } from "../../utils/AppError.js";
import { enqueueImport, isImportQueueEnabled, type ImportJobData } from "./imports.queue.js";
import { parseRevolutStatement, type StatementProduct } from "./revolut.parser.js";

/** Which Revolut sub-account feeds which app account type; other types cannot import statements. */
const PRODUCT_BY_ACCOUNT_TYPE: Partial<Record<AccountType, StatementProduct>> = {
  [AccountType.BANK]: "CURRENT",
  [AccountType.CARD]: "CURRENT",
  [AccountType.SAVINGS]: "SAVINGS",
};

/** Batch fields safe to return to the client (never the raw statement). */
const batchSelect = {
  id: true,
  accountId: true,
  fileName: true,
  status: true,
  imported: true,
  duplicates: true,
  skippedRows: true,
  error: true,
  createdAt: true,
  completedAt: true,
} satisfies Prisma.ImportBatchSelect;

/**
 * Stores an uploaded statement and queues it for background processing.
 * @throws AppError 503 when Redis is not configured, 400 for an account type without statement support.
 */
export async function createImport(userId: string, accountId: string, fileName: string, content: string) {
  if (!isImportQueueEnabled()) throw new AppError("Import výpisov momentálne nie je dostupný.", 503);

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw AppError.badRequest("Zvolený účet neexistuje.");
  if (!PRODUCT_BY_ACCOUNT_TYPE[account.type]) {
    throw AppError.badRequest("Výpis sa dá importovať len do bankového, kartového alebo sporiaceho účtu.");
  }

  const batch = await prisma.importBatch.create({
    data: { userId, accountId, fileName, rawContent: content },
    select: batchSelect,
  });

  try {
    await enqueueImport(batch.id);
  } catch (error) {
    await finishWithError(batch.id, "Import sa nepodarilo zaradiť do spracovania.");
    throw error;
  }
  return batch;
}

export async function getImport(userId: string, batchId: string) {
  const batch = await prisma.importBatch.findFirst({ where: { id: batchId, userId }, select: batchSelect });
  if (!batch) throw AppError.notFound("Import sa nenašiel.");
  return batch;
}

/**
 * BullMQ processor: parses the stored statement and inserts its transactions, categorized by the
 * user's rules or filed under "Nezaradené".
 * Invalid files fail immediately without retries; unexpected errors are retried and the batch
 * is marked FAILED only after the last attempt. The raw statement is deleted in both outcomes.
 */
export async function processImportJob(job: Job<ImportJobData>): Promise<void> {
  const { batchId } = job.data;
  try {
    await processBatch(batchId);
  } catch (error) {
    if (error instanceof AppError) {
      await finishWithError(batchId, error.message);
      throw new UnrecoverableError(error.message);
    }
    const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    if (isLastAttempt) await finishWithError(batchId, "Spracovanie výpisu zlyhalo. Skús to znova neskôr.");
    throw error;
  }
}

async function processBatch(batchId: string): Promise<void> {
  const batch = await prisma.importBatch.findUnique({ where: { id: batchId }, include: { account: true } });
  // Missing (account deleted meanwhile) or already finished: nothing left to do.
  if (!batch || batch.status === ImportStatus.DONE || batch.status === ImportStatus.FAILED) return;
  if (batch.rawContent === null) throw AppError.badRequest("Obsah výpisu chýba.");

  const product = PRODUCT_BY_ACCOUNT_TYPE[batch.account.type];
  if (!product) throw AppError.badRequest("Typ účtu nepodporuje import výpisov.");

  await prisma.importBatch.update({ where: { id: batchId }, data: { status: ImportStatus.PROCESSING } });

  const { transactions, skipped } = parseRevolutStatement(batch.rawContent, {
    currency: batch.account.currency,
    product,
  });
  const rules = await loadMatchableRules(batch.userId);

  await prisma.$transaction(async (tx) => {
    const categoryIds = await ensureUncategorized(tx, batch.userId);
    const { count } = await tx.transaction.createMany({
      data: transactions.map((t) => ({
        userId: batch.userId,
        accountId: batch.accountId,
        categoryId: matchCategory(rules, t.description, t.type) ?? categoryIds[t.type],
        importBatchId: batch.id,
        type: t.type,
        amount: t.amount,
        date: t.date,
        note: t.description,
        fingerprint: t.fingerprint,
      })),
      // The (accountId, fingerprint) unique index turns already imported rows into no-ops.
      skipDuplicates: true,
    });
    await tx.importBatch.update({
      where: { id: batchId },
      data: {
        status: ImportStatus.DONE,
        imported: count,
        duplicates: transactions.length - count,
        skippedRows: skipped as unknown as Prisma.InputJsonValue,
        rawContent: null,
        completedAt: new Date(),
      },
    });
  });
}

/** Returns the user's "Nezaradené" category id per type, creating the categories on first use. */
async function ensureUncategorized(tx: Prisma.TransactionClient, userId: string): Promise<Record<CategoryType, string>> {
  const upsert = (type: CategoryType) =>
    tx.category.upsert({
      where: { userId_name_type: { userId, name: UNCATEGORIZED.name, type } },
      create: { userId, type, ...UNCATEGORIZED },
      update: {},
      select: { id: true },
    });
  const [income, expense] = await Promise.all([upsert(CategoryType.INCOME), upsert(CategoryType.EXPENSE)]);
  return { [CategoryType.INCOME]: income.id, [CategoryType.EXPENSE]: expense.id };
}

async function finishWithError(batchId: string, message: string): Promise<void> {
  await prisma.importBatch.updateMany({
    where: { id: batchId },
    data: { status: ImportStatus.FAILED, error: message, rawContent: null, completedAt: new Date() },
  });
}
