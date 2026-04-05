import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { transactions, users } from "../db/schema.js";
import {
  createTransactionSchema,
  readTransactionSchema,
  updateTransactionSchema,
} from "../schema/transactionSchema.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { RoleType, StatusType } from "../types/types.js";

export const getTransactions = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const { id: userId, role } = req.user;

  const result = readTransactionSchema.safeParse(req.query);

  if (!result.success) {
    throw new ApiError(400, "Validation Error", result.error.issues);
  }

  const { type, category, startDate, endDate } = result.data;

  const filterConditions = [isNull(transactions.deletedAt)];

  if (type) {
    filterConditions.push(eq(transactions.type, type));
  }
  if (category) {
    filterConditions.push(eq(transactions.category, category));
  }
  if (startDate) {
    filterConditions.push(gte(transactions.createdAt, startDate));
  }
  if (endDate) {
    filterConditions.push(lte(transactions.createdAt, endDate));
  }

  if (role === RoleType.viewer) {
    filterConditions.push(eq(transactions.userId, userId));
  }

  const existingTransactions = await db.query.transactions.findMany({
    where: and(...filterConditions),
    columns: {
      updatedAt: false,
      deletedAt: false,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        existingTransactions.length === 0
          ? "No transactions found with given filters"
          : "Transactions fetched successfully",
        existingTransactions,
      ),
    );
};

export const createTransaction = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!req.body) {
    throw new ApiError(400, "Request body is required");
  }

  const result = createTransactionSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, "Validation Error", result.error.issues);
  }

  const { targetUserId, amount, type, category, description } = result.data;

  if (targetUserId === req.user.id) {
    throw new ApiError(
      400,
      "Admins cannot create transactions for their own account",
    );
  }

  const existingUser = await db.query.users.findFirst({
    where: and(
      eq(users.id, targetUserId),
      eq(users.role, RoleType.viewer),
      eq(users.status, StatusType.active),
    ),
    columns: {
      id: true,
    },
  });

  if (!existingUser) {
    throw new ApiError(
      404,
      "User not found. Please provide a valid user ID with role viewer and status active",
    );
  }

  const [newTransaction] = await db
    .insert(transactions)
    .values({
      userId: existingUser.id,
      amount: amount.toString(),
      type,
      category,
      description,
    })
    .returning();

  if (!newTransaction) {
    throw new ApiError(400, "Failed to create transaction");
  }

  const { updatedAt, deletedAt, ...response } = newTransaction;

  return res
    .status(201)
    .json(
      new ApiResponse(201, "Transaction is created successfully", response),
    );
};

export const updateTransaction = async (req: Request, res: Response) => {
  const { transactionId } = req.params;

  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!transactionId || typeof transactionId !== "string") {
    throw new ApiError(400, "Invalid Transaction ID");
  }

  if (!req.body) {
    throw new ApiError(400, "Request body is required");
  }

  const result = updateTransactionSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, "Validation Error", result.error.issues);
  }

  if (Object.keys(result.data).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const { amount, type, category, description } = result.data;

  const [updatedTransaction] = await db
    .update(transactions)
    .set({
      amount: amount?.toString(),
      type,
      category,
      description,
      updatedAt: new Date(),
    })
    .where(
      and(eq(transactions.id, transactionId), isNull(transactions.deletedAt)),
    )
    .returning();

  if (!updatedTransaction) {
    throw new ApiError(
      404,
      "Transaction not found or unauthorized or already deleted",
    );
  }

  const { deletedAt, ...response } = updatedTransaction;

  return res
    .status(200)
    .json(new ApiResponse(200, "Transaction updated successfully", response));
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const { transactionId } = req.params;

  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!transactionId || typeof transactionId !== "string") {
    throw new ApiError(400, "Invalid Transaction ID");
  }

  const [deletedTransaction] = await db
    .update(transactions)
    .set({
      deletedAt: new Date(),
    })
    .where(
      and(eq(transactions.id, transactionId), isNull(transactions.deletedAt)),
    )
    .returning({
      id: transactions.id,
    });

  if (!deletedTransaction) {
    throw new ApiError(
      404,
      "Transaction not found or unauthorized or already deleted",
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Transaction deleted successfully",
        deletedTransaction,
      ),
    );
};
