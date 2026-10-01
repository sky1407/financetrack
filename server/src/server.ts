import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { closeImportQueue, startImportWorker } from "./modules/imports/imports.queue.js";
import { processImportJob } from "./modules/imports/imports.service.js";

const app = createApp();
startImportWorker(processImportJob);

const server = app.listen(env.PORT, () => {
  console.log(`FinanceTrack API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received, shutting down server...`);
  server.close(() => {
    console.log("HTTP server closed.");
  });
  await closeImportQueue();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
