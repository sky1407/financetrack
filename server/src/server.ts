import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`FinanceTrack API beží na http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} prijatý, ukončujem server...`);
  server.close(() => {
    console.log("HTTP server zatvorený.");
  });
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
