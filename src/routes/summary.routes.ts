import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import {
  getDashboardSummary,
  getMonthlyTrends,
} from "../controllers/summary.controller.js";

const summaryRouter: Router = Router();

summaryRouter.use(authenticateUser);

/**
 * @swagger
 * /summary:
 *   get:
 *     summary: Get dashboard summary
 *     description: Aggregated data for total income, expense, net balance, category totals, and recent activity.
 *     tags: [Summary]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
summaryRouter.get("/", getDashboardSummary);

/**
 * @swagger
 * /summary/trends:
 *   get:
 *     summary: Get monthly income/expense trends
 *     tags: [Summary]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: months
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *         description: Number of months to fetch trends for
 *     responses:
 *       200:
 *         description: Monthly trends data
 */
summaryRouter.get("/trends", getMonthlyTrends);

export default summaryRouter;
