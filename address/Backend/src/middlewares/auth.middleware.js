import jwt from "jsonwebtoken";
import config from "../configs/auth.config.js";

const createAuthMiddleware = (role = "user") => {
  return async (req, res, next) => {
    try {
      const accessToken =
        req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];

      if (!accessToken) {
        if (process.env.NODE_ENV !== "production") {
          return next();
        }

        return res.status(404).json({
          message: "accesstoken not found",
        });
      }

      try {
        const decoded = jwt.verify(accessToken, config.JWT_SECRET_KEY);
        req.user = decoded;

        if (decoded.role > 0 && !role.includes(decoded.role)) {
          return res.status(403).json({
            message: "Forbidden: insufficient permissions",
          });
        }

        next();
      } catch (err) {
        return res.status(409).json({
          message: "invalid token",
        });
      }
    } catch (err) {
      return res.status(500).json({
        message: "internal server error",
      });
    }
  };
};

export default createAuthMiddleware;
