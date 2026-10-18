import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "hookrelay-api",
    timestamp: new Date().toISOString(),
  });
});
app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", database: "up" });
  } catch {
    res.status(503).json({ status: "not_ready", database: "down" });
  }
});

app.listen(env.PORT, () => {
  console.log(`Hookrelay API running at http://localhost:${env.PORT}`);
});
