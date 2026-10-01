import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export async function requireMockUser(req: Request, _res: Response, next: NextFunction) {
  const suppliedUserId = req.get("x-user-id")?.trim();
  req.user = { id: suppliedUserId || "demo-user-123" };
  next();
}
