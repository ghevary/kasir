import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { shifts, transactions } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";

const router = Router();

// POST /api/shifts/open — open new shift [Kasir]
router.post(
  "/open",
  rbacMiddleware("kasir"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Check if already has active shift
      const [existing] = await db
        .select()
        .from(shifts)
        .where(and(eq(shifts.kasirId, user.id), eq(shifts.status, "active")));

      if (existing) {
        res.status(400).json({
          error: "You already have an active shift",
          shift: existing,
        });
        return;
      }

      const [shift] = await db
        .insert(shifts)
        .values({ kasirId: user.id })
        .returning();

      res.status(201).json(shift);
    } catch (error) {
      console.error("Open shift error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/shifts/active — get active shift [Kasir]
router.get(
  "/active",
  rbacMiddleware("kasir"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const [shift] = await db
        .select()
        .from(shifts)
        .where(and(eq(shifts.kasirId, user.id), eq(shifts.status, "active")));

      if (!shift) {
        res.status(404).json({ error: "No active shift" });
        return;
      }

      res.json(shift);
    } catch (error) {
      console.error("Get active shift error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/shifts/close — close shift + reconciliation [Kasir]
router.post(
  "/close",
  rbacMiddleware("kasir"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { physicalCash, notes } = req.body;

      const [activeShift] = await db
        .select()
        .from(shifts)
        .where(and(eq(shifts.kasirId, user.id), eq(shifts.status, "active")));

      if (!activeShift) {
        res.status(400).json({ error: "No active shift to close" });
        return;
      }

      // Calculate shift totals from transactions
      const shiftTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.shiftId, activeShift.id),
            eq(transactions.status, "completed")
          )
        );

      let totalCash = 0;
      let totalQris = 0;
      let totalTransactions = 0;

      for (const tx of shiftTransactions) {
        const amount = parseFloat(tx.totalAmount);
        if (tx.paymentMethod === "cash") {
          totalCash += amount;
        } else {
          totalQris += amount;
        }
        totalTransactions++;
      }

      const totalRevenue = totalCash + totalQris;

      const [closedShift] = await db
        .update(shifts)
        .set({
          endedAt: new Date(),
          totalCash: totalCash.toString(),
          totalQris: totalQris.toString(),
          totalRevenue: totalRevenue.toString(),
          totalTransactions,
          physicalCash: physicalCash?.toString(),
          notes,
          status: "closed",
        })
        .where(eq(shifts.id, activeShift.id))
        .returning();

      res.json({
        shift: closedShift,
        summary: {
          totalTransactions,
          totalCash,
          totalQris,
          totalRevenue,
          physicalCash: parseFloat(physicalCash || "0"),
          difference: parseFloat(physicalCash || "0") - totalCash,
        },
      });
    } catch (error) {
      console.error("Close shift error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/shifts — all shifts history [Admin]
router.get(
  "/",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(shifts)
        .orderBy(desc(shifts.startedAt));
      res.json(result);
    } catch (error) {
      console.error("Get shifts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
