import type { Request, Response } from "express";
import { logInSchema, signUpSchema } from "../schema/authSchema.js";
import ApiError from "../utils/ApiError.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { StatusType } from "../types/types.js";

//  Registers a new user and hashes the password
export const signUp = async (req: Request, res: Response) => {
  if (!req.body) {
    throw new ApiError(400, "Request body is required");
  }

  const result = signUpSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, "Validation Error", result.error.issues);
  }

  const { name, email, password } = result.data;

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new ApiError(400, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning();

  if (!newUser) {
    throw new ApiError(500, "Internal Server Error: Failed to create user");
  }

  const { password: _, ...user } = newUser;

  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", user));
};

// Authenticates a user and issues a JWT via an HTTP-only cookie
export const logIn = async (req: Request, res: Response) => {
  if (!req.body) {
    throw new ApiError(400, "Request body is required");
  }

  const result = logInSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, "Validation Error", result.error.issues);
  }

  const { email, password } = result.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.status === StatusType.inactive) {
    throw new ApiError(
      403,
      "Your account is deactivated. Please contact an admin.",
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.TOKEN_SECRET!,
    {
      expiresIn: "7d",
    },
  );

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
    .json(
      new ApiResponse(200, "User logged in successfully", {
        email,
        role: user.role,
      }),
    );
};
// Clear the authentication cookie to log out the user
export const logOut = async (_: Request, res: Response) => {
  return res
    .status(200)
    .clearCookie("token", { httpOnly: true, secure: true, sameSite: "strict" })
    .json(new ApiResponse(200, "User logged out successfully"));
};
