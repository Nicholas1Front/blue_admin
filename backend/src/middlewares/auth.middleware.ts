import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { AppError } from "../shared/errors/AppError.js";
import type { AuthUser } from "../modules/auth/auth.types.js";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new AppError(
      "Authentication token not provided",
      401,
      "TOKEN_NOT_PROVIDED",
    );
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError(
      "Invalid authentication token",
      401,
      "INVALID_TOKEN",
    );
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    );

    const user = decoded as AuthUser;

    req.user = user;

    return next();
  } catch {
    throw new AppError(
      "Invalid authentication token",
      401,
      "INVALID_TOKEN",
    );
  }
}