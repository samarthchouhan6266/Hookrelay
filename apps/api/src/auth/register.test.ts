import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../server.js";
import { prisma } from "../db/prisma.js";

afterAll(async () => {
  await prisma.$disconnect();
});

const uniqueEmail = () => `user-${randomUUID()}@example.com`;
const PASSWORD = "a-long-enough-password";

describe("POST /auth/register", () => {
  it("creates a user, normalizes email, and never returns the hash", async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post("/auth/register")
      .send({ email: `  ${email.toUpperCase()}  `, password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(stored.passwordHash.startsWith("$argon2id$")).toBe(true);
  });

  it("returns 409 for a duplicate email, even with different casing", async () => {
    const email = uniqueEmail();
    await request(app).post("/auth/register").send({ email, password: PASSWORD });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: email.toUpperCase(), password: PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
    expect(res.body.error.requestId).toEqual(expect.any(String));
  });

  it("returns 422 with details for invalid input", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["email", "password"]));
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send("{ not json");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });

  it("creates exactly one user when the same email registers concurrently", async () => {
    const email = uniqueEmail();
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).post("/auth/register").send({ email, password: PASSWORD }),
      ),
    );

    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });
});

describe("unknown routes", () => {
  it("return the standard error shape with 404", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});