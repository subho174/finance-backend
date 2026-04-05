import { z } from "zod";

import { RoleType, StatusType } from "../types/types.js";

export const signUpSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters long"),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .trim()
    .min(6, "Password must be at least 6 characters long"),
});

export const logInSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .trim()
    .min(6, "Password must be at least 6 characters long"),
});

export const adminCreateUserSchema = signUpSchema.extend({
  role: z.nativeEnum(RoleType).default(RoleType.viewer).optional(),
  status: z.nativeEnum(StatusType).default(StatusType.active).optional(),
});
