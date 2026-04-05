import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "../controllers/transaction.controller.js";
import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";
import { RoleType } from "../types/types.js";

export const transactionRouter: Router = Router();

transactionRouter.use(authenticateUser);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get transactions
 *     description: Returns a list of transactions. Viewers only see their own. Analysts and Admins see all.
 *     tags: [Transactions]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         description: YYYY-MM-DD
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         description: YYYY-MM-DD
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Transaction' }
 */
transactionRouter.get("/", getTransactions);

transactionRouter.use(authorizeRoles(RoleType.admin));

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction (Admin only)
 *     tags: [Transactions]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId, amount, type, category]
 *             properties:
 *               targetUserId: { type: string, format: uuid }
 *               amount: { type: number }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Transaction created
 */
transactionRouter.post("/", createTransaction);

/**
 * @swagger
 * /transactions/{transactionId}:
 *   patch:
 *     summary: Update a transaction (Admin only)
 *     tags: [Transactions]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Transaction updated
 */
transactionRouter.patch("/:transactionId", updateTransaction);

/**
 * @swagger
 * /transactions/{transactionId}:
 *   delete:
 *     summary: Delete a transaction (Admin only)
 *     tags: [Transactions]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Transaction deleted (soft delete)
 */
transactionRouter.delete("/:transactionId", deleteTransaction);
