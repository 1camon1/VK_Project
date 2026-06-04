import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export type AuthRequest = Request & {
  user?: {
    userId: string;
    role: "ORGANIZER" | "PARTICIPANT";
  };
};

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
