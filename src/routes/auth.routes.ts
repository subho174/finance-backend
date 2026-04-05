import { Router } from "express";
import { logIn, logOut, signUp } from "../controllers/auth.controller.js";

const authRouter: Router = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
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
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation Error
 */
authRouter.post("/signup", signUp);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in to the application
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */
authRouter.post("/login", logIn);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out from the application
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
authRouter.post("/logout", logOut);

export default authRouter;
