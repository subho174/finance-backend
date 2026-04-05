import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  pgEnum,
  check,
  index,
} from "drizzle-orm/pg-core";
import { RoleType, StatusType } from "../types/types.js";

export const roleEnum = pgEnum("role", ["viewer", "analyst", "admin"]);
export const typeEnum = pgEnum("type", ["income", "expense"]);
export const statusEnum = pgEnum("status", ["active", "inactive"]);
export const categoryEnum = pgEnum("category", [
  "salary",
  "rent",
  "food",
  "transportation",
  "entertainment",
  "other",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: roleEnum("role").default(RoleType.viewer),
    status: statusEnum("status").default(StatusType.active),
  },
  (table) => ({
    // regex check for an @ symbol and a dot
    emailCheck: check(
      "email_check",
      sql`${table.email} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`,
    ),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    type: typeEnum("type").notNull(),
    category: categoryEnum("category").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("user_id_idx").on(t.userId),
    index("category_idx").on(t.category),
    index("type_category_idx").on(t.type, t.category),
    index("created_at_idx").on(t.createdAt),
    index("user_income_calc_idx")
      .on(t.userId, t.amount)
      .where(sql`${t.type} = 'income' AND ${t.deletedAt} IS NULL`),
    index("user_expense_calc_idx")
      .on(t.userId, t.amount)
      .where(sql`${t.type} = 'expense' AND ${t.deletedAt} IS NULL`),
    index("global_income_calc_idx")
      .on(t.amount)
      .where(sql`${t.type} = 'income' AND ${t.deletedAt} IS NULL`),
    index("global_expense_calc_idx")
      .on(t.amount)
      .where(sql`${t.type} = 'expense' AND ${t.deletedAt} IS NULL`),
  ],
);
