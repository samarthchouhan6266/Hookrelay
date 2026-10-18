import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

function body(
  requestId: string,
  code: string,
  message: string,
  details?: unknown,
) {
  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      requestId,
    },
  };
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json(body(res.locals.requestId, "NOT_FOUND", "Route not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const requestId = res.locals.requestId as string;

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    }));
    res
      .status(422)
      .json(body(requestId, "VALIDATION_ERROR", "Invalid request", details));
    return;
  }

  if (err instanceof AppError) {
    res
      .status(err.status)
      .json(body(requestId, err.code, err.message, err.details));
    return;
  }

  const type = (err as { type?: string } | null)?.type;
  if (type === "entity.parse.failed") {
    res.status(400).json(body(requestId, "INVALID_JSON", "Malformed JSON body"));
    return;
  }
  if (type === "entity.too.large") {
    res.status(413).json(body(requestId, "PAYLOAD_TOO_LARGE", "Body too large"));
    return;
  }

  console.error({ requestId, err });
  res
    .status(500)
    .json(body(requestId, "INTERNAL_ERROR", "Something went wrong"));
};