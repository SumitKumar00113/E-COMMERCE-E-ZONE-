import jwt from "jsonwebtoken";
import config from "../configs/auth.config.js";
import userModel from "../models/user.model.js";
   

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const token = bearerToken || req.cookies?.accessToken;


    if (!token) {
      return res.status(401).json({ message: "authentication token missing" });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET_KEY);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "invalid authentication token" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "invalid authentication token" });
  }
};

export default {authenticateUser}
