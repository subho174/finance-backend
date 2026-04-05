import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { CategoryType, TransactionType } from "../types/types.js";
import z from "zod";
import { transactions } from "../db/schema.js";

export const createTransactionSchema = createInsertSchema(transactions, {
  description: z.string().trim().max(500).optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
}).extend({
  targetUserId: z.string().uuid("Invalid User ID format"),
});

export const updateTransactionSchema = createUpdateSchema(transactions, {
  description: z.string().trim().max(500).optional(),
  amount: z.coerce.number().positive("Amount must be positive").optional(),
});

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD

export const readTransactionSchema = z.object({
  type: z
    .nativeEnum(TransactionType, { error: "Invalid transaction type" })
    .optional(),
  category: z
    .nativeEnum(CategoryType, { error: "Invalid category" })
    .optional(),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || dateRegex.test(val), {
      message: "Date must be in YYYY-MM-DD format",
    })
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((date) => !date || !isNaN(date.getTime()), {
      message: "Invalid date",
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || dateRegex.test(val), {
      message: "Date must be in YYYY-MM-DD format",
    })
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((date) => !date || !isNaN(date.getTime()), {
      message: "Invalid date",
    }),
});
