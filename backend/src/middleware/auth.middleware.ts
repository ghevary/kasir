import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

// Simple session-based auth middleware
// In production, replace with Better Auth session validation
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.headers["x-user-id"] as string;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing authentication" });
    return;
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Unauthorized: Invalid user" });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: "Authentication error" });
  }
}

// Role-based access control middleware
export function rbacMiddleware(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res
        .status(403)
        .json({ error: `Forbidden: Requires role ${allowedRoles.join(" or ")}` });
      return;
    }

    next();
  };
}
