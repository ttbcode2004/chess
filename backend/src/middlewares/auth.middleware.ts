import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../libs/jwt.lib";
import User, { IUser } from "../models/user.model";


declare global {
  namespace Express {
    interface User extends IUser {} // 🔥 quan trọng

    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = user as any;
  req.userId = user._id.toString();

  return next();
};