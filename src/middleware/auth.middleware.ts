import type { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { RoleType, type TokenType } from "../types/types.js";

export const authenticateUser = async (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decodedToken = jwt.verify(
      token,
      process.env.TOKEN_SECRET!,
    ) as TokenType;

    req.user = decodedToken;
    next();
  } catch (error) {
    let message = "Invalid Token";
    
    if (error instanceof Error && error.name === "TokenExpiredError") {
      message = "Token Expired";
    }

    throw new ApiError(401, message);
  }
};

export const authorizeRoles =
  (...roles: RoleType[]) =>
  (req: Request, _: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );
    }
    next();
  };
