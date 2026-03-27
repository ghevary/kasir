import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { menuItems, stockIn, stockOut } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/stock/monitor — all items + stock [Admin]
router.get(
  "/monitor",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(menuItems)
        .orderBy(menuItems.stockQty);
      res.json(result);
    } catch (error) {
      console.error("Stock monitor error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/stock/in — input barang masuk [Admin]
router.post(
  "/in",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { menuItemId, qty, notes, supplier, purchasePrice } = req.body;

      if (!menuItemId || !qty) {
        res.status(400).json({ error: "menuItemId and qty required" });
        return;
      }

      // Record stock in
      const [record] = await db
        .insert(stockIn)
        .values({
          menuItemId,
          adminId: user.id,
          qty,
          notes,
          supplier,
          purchasePrice,
        })
        .returning();

      // Update stock_qty on menu item
      await db
        .update(menuItems)
        .set({
          stockQty: sql`${menuItems.stockQty} + ${qty}`,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, menuItemId));

      res.status(201).json(record);
    } catch (error) {
      console.error("Stock in error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/stock/in — riwayat barang masuk [Admin]
router.get(
  "/in",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(stockIn)
        .orderBy(desc(stockIn.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Stock in history error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/stock/out — riwayat barang keluar [Admin, Gudang]
router.get(
  "/out",
  rbacMiddleware("admin", "gudang"),
  async (req: Request, res: Response) => {
    try {
      const result = await db
        .select()
        .from(stockOut)
        .orderBy(desc(stockOut.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Stock out history error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/stock/out — input barang keluar manual [Gudang]
router.post(
  "/out",
  rbacMiddleware("gudang"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { menuItemId, qty, notes, notaNumber, stockRequestId } = req.body;

      if (!menuItemId || !qty) {
        res.status(400).json({ error: "menuItemId and qty required" });
        return;
      }

      const [record] = await db
        .insert(stockOut)
        .values({
          menuItemId,
          gudangId: user.id,
          qty,
          notes,
          notaNumber,
          stockRequestId,
        })
        .returning();

      // Deduct stock
      await db
        .update(menuItems)
        .set({
          stockQty: sql`GREATEST(${menuItems.stockQty} - ${qty}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, menuItemId));

      res.status(201).json(record);
    } catch (error) {
      console.error("Stock out error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
