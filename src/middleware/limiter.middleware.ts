import { rateLimit } from "express-rate-limit";
import ApiError from "../utils/ApiError.js";

// General rate limiter for API endpoints to prevent DDoS and spam (100 requests per 15 minutes per IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, _res, _next) => {
    throw new ApiError(
      429,
      `Too many requests from this IP, please try again later.`,
    );
  },
});

// Strict rate limiter for Auth endpoints to prevent brute-force attacks (15 attempts per 15 minutes per IP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, _res, _next) => {
    throw new ApiError(429, `Too many attempts. Please try again later.`);
  },
});
