declare global {
  namespace Express {
    interface Request {
      user?: TokenType;
    }
  }
}

export enum RoleType {
  viewer = "viewer",
  analyst = "analyst",
  admin = "admin",
}

export enum StatusType {
  active = "active",
  inactive = "inactive",
}

export enum TransactionType {
  income = "income",
  expense = "expense",
}

export enum CategoryType {
  salary = "salary",
  rent = "rent",
  food = "food",
  transportation = "transportation",
  entertainment = "entertainment",
  other = "other",
}

export interface TokenType {
  id: string;
  email: string;
  role: RoleType;
}
