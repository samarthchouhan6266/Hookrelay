import { prisma } from "../db/prisma.js";
import { AppError, isUniqueViolation } from "../errors/app-error.js";
import { hashPassword } from "./password.js";
import type { RegisterInput } from "./auth.schemas.js";

export async function registerUser(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.user.create({
      data: { email: input.email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(
        409,
        "EMAIL_TAKEN",
        "An account with this email already exists",
      );
    }
    throw err;
  }
}