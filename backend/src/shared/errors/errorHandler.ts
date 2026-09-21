import { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError.js";
import { logger } from "../logger/logger.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  if (error instanceof Error) {
      logger.error(
        {
          err: error,
        },
        "Unhandled application error",
      );
  } else {
    logger.error(
      {
        error,
      },
      "Unhandled unknown error",
    );
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Ocorreu um erro interno no servidor.",
    },
  });
}