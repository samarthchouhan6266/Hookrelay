import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "./server.js";
import { prisma } from "./db/prisma.js";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("health endpoints", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /ready reports the database as up", async () => {
    const res = await request(app).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body.database).toBe("up");
  });
});

describe("users table", () => {
  it("rejects duplicate emails at the database level", async () => {
    const email = `dup-${Date.now()}@example.com`;
    await prisma.user.create({ data: { email } });

    await expect(prisma.user.create({ data: { email } })).rejects.toMatchObject(
      { code: "P2002" },
    );
  });
});