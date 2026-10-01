import { Queue, Worker, type Job } from "bullmq";
import { env } from "../../config/env.js";

const QUEUE_NAME = "statement-imports";

/** Job payload carries only the batch id; the statement itself stays in Postgres, never in Redis. */
export interface ImportJobData {
  batchId: string;
}

const connection = env.REDIS_URL ? { url: env.REDIS_URL } : null;

/** Null when REDIS_URL is not configured. */
const queue = connection
  ? new Queue<ImportJobData>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 24 * 3600 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    })
  : null;

let worker: Worker<ImportJobData> | null = null;

export function isImportQueueEnabled(): boolean {
  return queue !== null;
}

/** Enqueues processing of a batch; the batch id doubles as job id, so enqueuing twice is a no-op. */
export async function enqueueImport(batchId: string): Promise<void> {
  if (!queue) throw new Error("Import queue is not configured (REDIS_URL is missing).");
  await queue.add("process", { batchId }, { jobId: batchId });
}

/** Starts the in-process worker; does nothing when Redis is not configured. */
export function startImportWorker(processor: (job: Job<ImportJobData>) => Promise<void>): void {
  if (!connection || worker) return;
  worker = new Worker<ImportJobData>(QUEUE_NAME, processor, {
    connection,
    concurrency: 2,
    // Long-poll 30 s instead of 5 s on an empty queue: new jobs still wake the worker immediately,
    // but an idle worker sends ~6x fewer commands (managed Redis plans meter commands).
    drainDelay: 30,
  });
  worker.on("failed", (job, error) => {
    console.error(`Import job ${job?.id ?? "?"} failed (attempt ${job?.attemptsMade ?? "?"}):`, error.message);
  });
  worker.on("error", (error) => console.error("Import worker error:", error.message));
}

/** Lets the running job finish, then closes Redis connections. */
export async function closeImportQueue(): Promise<void> {
  await Promise.all([worker?.close(), queue?.close()]);
}
