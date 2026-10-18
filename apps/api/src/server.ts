import express from "express";
import { prisma } from "./db/prisma.js";
import { authRouter } from "./auth/auth.routes.js";
import { requestId } from "./middleware/request-id.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export const app = express();

app.disable("x-powered-by");
app.use(requestId);
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

app.use("/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);