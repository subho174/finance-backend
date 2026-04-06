import "dotenv/config";
import express, {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
// import cors from "cors";
import cookieParser from "cookie-parser";
import ApiError from "./utils/ApiError.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import { transactionRouter } from "./routes/transaction.routes.js";
import summaryRouter from "./routes/summary.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utils/swagger.js";
import { apiLimiter, authLimiter } from "./middleware/limiter.middleware.js";

if (!process.env.PORT) {
  throw new Error("PORT was not provided in .env file");
}

// if (!process.env.ORIGIN_URL) {
//   throw new Error("ORIGIN_URL was not provided in .env file");
// }

const app = express();

// app.use(
//   cors({
//     origin: process.env.ORIGIN_URL,
//     credentials: true,
//   })
// )

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.set("trust proxy", 1);

app.get("/", (_, res: Response) => {
  res.send("Server is running !");
});

const apiRouter = Router();

apiRouter.use(apiLimiter);
apiRouter.use("/auth", authLimiter, authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/summary", summaryRouter);
apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1", apiRouter);

app.use(
  (err: Error | ApiError, _: Request, res: Response, next: NextFunction) => {
    console.log(err);

    if (res.headersSent) {
      return next(err);
    }

    const isCustomError = err instanceof ApiError;

    const statusCode = isCustomError ? err.statusCode : 500;
    const errors = isCustomError ? err.errors : [];
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
      status: statusCode,
      message: message,
      errors,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  },
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
