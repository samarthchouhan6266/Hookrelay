import { Router } from "express";
import { registerSchema } from "./auth.schemas.js";
import { registerUser } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);
  res.status(201).json({ user });
});