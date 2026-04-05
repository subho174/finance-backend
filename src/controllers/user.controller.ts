import type { Request, Response } from "express";
import ApiError from "../utils/ApiError.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { ApiResponse } from "../utils/ApiResponse.js";
import { RoleType, StatusType } from "../types/types.js";
import { adminCreateUserSchema } from "../schema/authSchema.js";
import bcrypt from "bcrypt";

export const createUser = async (req: Request, res: Response) => {
  if (!req.body) {
    throw new ApiError(400, "Request body is required");
  }

  const result = adminCreateUserSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, "Validation Error", result.error.issues);
  }

  const { name, email, password, role, status } = result.data;

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new ApiError(400, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      role,
      status,
    })
    .returning();

  if (!newUser) {
    throw new ApiError(500, "Failed to create user");
  }

  const { password: _, ...response } = newUser;

  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully by Admin", response));
};

export const getAllUsers = async (_: Request, res: Response) => {
  const allUsers = await db.query.users.findMany({
    columns: {
      password: false,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Fetched all users", allUsers));
};

export const updateUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role, status } = req.body;

  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!userId || typeof userId !== "string") {
    throw new ApiError(400, "Invalid User ID");
  }

  if (!role && !status) {
    throw new ApiError(400, "No data provided to update");
  }

  if (role && !Object.values(RoleType).includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  if (status && !Object.values(StatusType).includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  if (
    userId === req.user.id &&
    (status === StatusType.inactive || role !== RoleType.admin)
  ) {
    throw new ApiError(
      400,
      "You cannot deactivate or demote your own admin account",
    );
  }

  const [updatedUser] = await db
    .update(users)
    .set({ role, status })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role, status: users.status });

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User details is updated", updatedUser));
};
