import express from "express";
import addressRouter from "./routes/address.route.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/addresses", addressRouter);
app.use("/api/get",addressRouter);
app.use("/api/patch",addressRouter)
app.use("api/delete",addressRouter)
export default app;
