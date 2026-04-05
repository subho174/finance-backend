import { Router } from "express";
import {
  createUser,
  getAllUsers,
  updateUser,
} from "../controllers/user.controller.js";
import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";
import { RoleType } from "../types/types.js";

const userRouter: Router = Router();

userRouter.use(authenticateUser, authorizeRoles(RoleType.admin));

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Admin creates a new user directly
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [viewer, analyst, admin] }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       201:
 *         description: User created successfully by Admin
 *       400:
 *         description: Validation Error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
userRouter.post("/", createUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Fetched all users
 */
userRouter.get("/", getAllUsers);

/**
 * @swagger
 * /users/{userId}:
 *   patch:
 *     summary: Update user role and status (Admin only)
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [viewer, analyst, admin] }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: User details updated
 *       404:
 *         description: User not found
 */
userRouter.patch("/:userId", updateUser);

export default userRouter;
