import express from "express";
import addressRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/addresses", addressRouter);
app.use("/api/get",addressRouter)
export default app;
