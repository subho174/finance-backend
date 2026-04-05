import type { Request, Response } from "express";
import ApiError from "../utils/ApiError.js";
import { db } from "../db/index.js";
import { transactions } from "../db/schema.js";
import { and, desc, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { CategoryType, RoleType } from "../types/types.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Calculates dashboard statistics including totals, category breakdown, and recent activity (Self for Viewers, Global for Analyst/Admin)
export const getDashboardSummary = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const { id: userId, role } = req.user;

  if (!role || !Object.values(RoleType).includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  let filterConditions = [isNull(transactions.deletedAt)];

  if (role === RoleType.viewer) {
    filterConditions.push(eq(transactions.userId, userId));
  }

  const results = await Promise.allSettled([
    db
      .select({
        category: transactions.category, // This will be null for 1 row
        income: sum(
          sql`CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END`,
        ),
        expense: sum(
          sql`CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END`,
        ),
      })
      .from(transactions)
      .where(and(...filterConditions))
      .groupBy(sql`ROLLUP(${transactions.category})`),

    db
      .select()
      .from(transactions)
      .where(and(...filterConditions))
      .orderBy(desc(transactions.createdAt))
      .limit(10),
  ]);

  const rollupData = results[0].status === "fulfilled" ? results[0].value : [];
  const recentActivities =
    results[1].status === "fulfilled" ? results[1].value : [];

  const grandTotalRow = rollupData.find((row) => row.category === null);

  const totalIncome = Number(grandTotalRow?.income ?? 0);
  const totalExpense = Number(grandTotalRow?.expense ?? 0);
  const netBalance = totalIncome - totalExpense;

  const categoryMap = new Map();
  for (const row of rollupData) {
    if (row.category) categoryMap.set(row.category, row);
  }
  const formattedCategoryTotals = Object.values(CategoryType).map(
    (category) => {
      const data = categoryMap.get(category);
      return {
        category,
        totalIncome: Number(data?.income ?? 0),
        totalExpense: Number(data?.expense ?? 0),
      };
    },
  );

  const response = {
    stats: {
      totalIncome,
      totalExpense,
      netBalance,
    },
    categoryTotals: formattedCategoryTotals,
    recentActivities: recentActivities.map(
      ({ updatedAt, deletedAt, amount, ...rest }) => ({
        amount: Number(amount),
        ...rest,
      }),
    ),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Dashboard summary fetched successfully", response),
    );
};

// Generates monthly income vs expense trends for a specified lookback period (Self for Viewers, Global for Analyst/Admin)
export const getMonthlyTrends = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const { id: userId, role } = req.user;

  if (!role || !Object.values(RoleType).includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const { months } = req.query;
  const monthsInNum = Number(months);

  if (
    !months ||
    typeof months !== "string" ||
    isNaN(monthsInNum) ||
    monthsInNum <= 0 ||
    monthsInNum > 12
  ) {
    throw new ApiError(
      400,
      "Months should be a query parameter and a positive number less than or equal to 12",
    );
  }

  const startDate = new Date();
  startDate.setDate(1); // moving to 1st day of current month
  startDate.setMonth(startDate.getMonth() - (monthsInNum - 1)); // moving to the start of the range
  startDate.setHours(0, 0, 0, 0); // setting to 00:00:00 for a clean database range

  const filterConditions = [
    isNull(transactions.deletedAt),
    gte(transactions.createdAt, startDate),
  ];

  if (role === RoleType.viewer) {
    filterConditions.push(eq(transactions.userId, userId));
  }

  const monthlyData = await db
    .select({
      month: sql<string>`date_trunc('month', ${transactions.createdAt})`,
      income: sum(
        sql`CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END`,
      ),
      expense: sum(
        sql`CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END`,
      ),
    })
    .from(transactions)
    .where(and(...filterConditions))
    .groupBy(sql`date_trunc('month', ${transactions.createdAt})`)
    .orderBy(desc(sql`date_trunc('month', ${transactions.createdAt})`));

  const formattedTrends = monthlyData.map(({ month, income, expense }) => ({
    // converting the DB timestamp to a readable name like "May 2024"
    monthName: new Date(month).toLocaleString("default", {
      month: "short",
      year: "numeric",
    }),
    income: Number(income ?? 0),
    expense: Number(expense ?? 0),
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Monthly trends fetched successfully",
        formattedTrends,
      ),
    );
};
