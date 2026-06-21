import jwt from "jsonwebtoken";
import config from "../configs/auth.config.js";

const createAuthMiddleware = (roles = ["user"]) => {
  return async (req, res, next) => {
    try {
      const accessToken =
        req.cookies?.accessToken ||
        req.headers?.authorization?.split(" ")[1];

      if (!accessToken) {
        return res.status(401).json({
          message: "Unauthorized: token is missing",
        });
      }

      try {
        const decoded = jwt.verify(
          accessToken,
          config.JWT_SECRET_KEY
        );

        if (!roles.includes(decoded.role)) {
          return res.status(403).json({
            message: "Forbidden: insufficient permissions",
          });
        }

        req.user = decoded;
        next();
      } catch (err) {
        return res.status(401).json({
          message: "Unauthorized: token is invalid",
        });
      }
    } catch (err) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };
};

export default createAuthMiddleware;