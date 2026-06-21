import express from "express";
import productRouter from "./routes/product.route.js";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/products", productRouter);
app.use("/api/get", productRouter);
app.use("/api/update/products", productRouter);
app.use("/api/delete/products", productRouter);
app.use("/api/search/products", productRouter);

export default app;
