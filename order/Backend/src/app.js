import express from "express";
import cookieParser from "cookie-parser";
import orderRouter from "./routes/order.routes.js";
import cors from "cors";

// =========================
// Order App Setup
// =========================
const authMiddlewareModule =
  await import("./middlewares/order.middleware.js");
const createAuthMiddleware =
  authMiddlewareModule.default ?? authMiddlewareModule;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use("/api", createAuthMiddleware(), orderRouter);


export default app;
