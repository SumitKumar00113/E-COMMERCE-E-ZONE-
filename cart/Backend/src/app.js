import express from "express";
import cartRouter from "./routes/cart.routes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/cart", cartRouter);

export default app;
