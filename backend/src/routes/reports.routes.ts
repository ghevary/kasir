import { Router, Request, Response } from "express";
import { db } from "../config/db";
import {
  transactions,
  transactionItems,
  menuItems,
  stockIn,
  stockOut,
} from "../db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/reports/sales
router.get(
  "/sales",
  rbacMiddleware("admin", "kasir"),
  async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      let conditions: any[] = [eq(transactions.status, "completed")];

      if (from) conditions.push(gte(transactions.createdAt, new Date(from as string)));
      if (to) conditions.push(lte(transactions.createdAt, new Date(to as string)));

      const result = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt));

      const totalRevenue = result.reduce(
        (sum, t) => sum + parseFloat(t.totalAmount),
        0
      );

      res.json({
        transactions: result,
        summary: {
          totalTransactions: result.length,
          totalRevenue,
        },
      });
    } catch (error) {
      console.error("Sales report error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/reports/financial
router.get(
  "/financial",
  rbacMiddleware("admin", "kasir"),
  async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      let conditions: any[] = [eq(transactions.status, "completed")];

      if (from) conditions.push(gte(transactions.createdAt, new Date(from as string)));
      if (to) conditions.push(lte(transactions.createdAt, new Date(to as string)));

      const result = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt));

      let totalCash = 0;
      let totalQris = 0;

      result.forEach((t) => {
        const amount = parseFloat(t.totalAmount);
        if (t.paymentMethod === "cash") totalCash += amount;
        else totalQris += amount;
      });

      res.json({
        transactions: result,
        summary: {
          totalCash,
          totalQris,
          totalRevenue: totalCash + totalQris,
          totalTransactions: result.length,
        },
      });
    } catch (error) {
      console.error("Financial report error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/reports/stock-in
router.get(
  "/stock-in",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(stockIn)
        .orderBy(desc(stockIn.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Stock in report error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/reports/stock-out
router.get(
  "/stock-out",
  rbacMiddleware("admin", "gudang"),
  async (req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(stockOut)
        .orderBy(desc(stockOut.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Stock out report error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/reports/daily-sales [Kasir]
router.get(
  "/daily-sales",
  rbacMiddleware("kasir"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await db
        .select({
          menuItemId: transactionItems.menuItemId,
          menuItemName: menuItems.name,
          totalQty: sql<number>`SUM(${transactionItems.qty})::int`,
          totalAmount: sql<string>`SUM(${transactionItems.subtotal})`,
        })
        .from(transactionItems)
        .innerJoin(
          transactions,
          eq(transactionItems.transactionId, transactions.id)
        )
        .innerJoin(menuItems, eq(transactionItems.menuItemId, menuItems.id))
        .where(
          and(
            eq(transactions.kasirId, user.id),
            eq(transactions.status, "completed"),
            gte(transactions.createdAt, today)
          )
        )
        .groupBy(transactionItems.menuItemId, menuItems.name);

      res.json(result);
    } catch (error) {
      console.error("Daily sales report error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
