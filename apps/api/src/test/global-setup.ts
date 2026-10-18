import { execSync } from "node:child_process";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

export default async function setup() {
  const container = await new PostgreSqlContainer("postgres:17-alpine").start();

  const url = container
    .getConnectionUri()
    .replace(/^postgres:\/\//, "postgresql://");

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = url;

  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });

  return async () => {
    await container.stop();
  };
}