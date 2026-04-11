import { Router, Request, Response } from "express";
import { db } from "../config/db";
import {
  transactions,
  transactionItems,
  menuItems,
  shifts,
} from "../db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// POST /api/transactions — create new transaction [Kasir]
router.post(
  "/",
  rbacMiddleware("kasir"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { customerName, items, paymentMethod, paidAmount } = req.body;

      if (!items || items.length === 0) {
        res.status(400).json({ error: "Items are required" });
        return;
      }

      // Check active shift
      const [activeShift] = await db
        .select()
        .from(shifts)
        .where(and(eq(shifts.kasirId, user.id), eq(shifts.status, "active")));

      if (!activeShift) {
        res.status(400).json({ error: "No active shift. Open a shift first." });
        return;
      }

      // Calculate total
      let totalAmount = 0;
      const itemDetails: any[] = [];

      for (const item of items) {
        const [menuItem] = await db
          .select()
          .from(menuItems)
          .where(eq(menuItems.id, item.menuItemId));

        if (!menuItem) {
          res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
          return;
        }

        if ((menuItem.outletQty || 0) < item.qty) {
          res.status(400).json({
            error: `Stok outlet tidak cukup untuk ${menuItem.name}. Tersedia: ${menuItem.outletQty}`,
          });
          return;
        }

        const subtotal = parseFloat(menuItem.price) * item.qty;
        totalAmount += subtotal;

        itemDetails.push({
          menuItemId: item.menuItemId,
          qty: item.qty,
          unitPrice: menuItem.price,
          subtotal: subtotal.toString(),
          name: menuItem.name,
        });
      }

      const changeAmount = paymentMethod === "cash"
        ? Math.max(parseFloat(paidAmount || "0") - totalAmount, 0)
        : 0;

      // Create transaction (all payments are completed immediately — manual recording)
      const [transaction] = await db
        .insert(transactions)
        .values({
          kasirId: user.id,
          shiftId: activeShift.id,
          customerName: customerName || "Umum",
          totalAmount: totalAmount.toString(),
          paidAmount: (paidAmount || totalAmount).toString(),
          changeAmount: changeAmount.toString(),
          paymentMethod,
          status: "completed",
        })
        .returning();

      // Create transaction items & deduct outlet stock
      for (const item of itemDetails) {
        await db.insert(transactionItems).values({
          transactionId: transaction.id,
          menuItemId: item.menuItemId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });

        // Deduct outlet stock and total stock
        await db
          .update(menuItems)
          .set({
            outletQty: sql`GREATEST(${menuItems.outletQty} - ${item.qty}, 0)`,
            stockQty: sql`GREATEST(${menuItems.stockQty} - ${item.qty}, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(menuItems.id, item.menuItemId));
      }

      res.status(201).json({
        transaction,
        items: itemDetails,
      });
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/transactions
router.get(
  "/",
  rbacMiddleware("kasir", "admin"),
  async (req: Request, res: Response) => {
    try {
      const result = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/transactions/:id
router.get(
  "/:id",
  rbacMiddleware("kasir", "admin"),
  async (req: Request, res: Response) => {
    try {
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, req.params.id as string));

      if (!transaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      const items = await db
        .select()
        .from(transactionItems)
        .where(eq(transactionItems.transactionId, transaction.id));

      res.json({ ...transaction, items });
    } catch (error) {
      console.error("Get transaction error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/transactions/:id/receipt
router.get(
  "/:id/receipt",
  rbacMiddleware("kasir", "admin"),
  async (req: Request, res: Response) => {
    try {
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, req.params.id as string));

      if (!transaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      const items = await db
        .select({
          id: transactionItems.id,
          qty: transactionItems.qty,
          unitPrice: transactionItems.unitPrice,
          subtotal: transactionItems.subtotal,
          menuItemName: menuItems.name,
        })
        .from(transactionItems)
        .leftJoin(menuItems, eq(transactionItems.menuItemId, menuItems.id))
        .where(eq(transactionItems.transactionId, transaction.id));

      res.json({
        receipt: {
          ...transaction,
          items,
        },
      });
    } catch (error) {
      console.error("Get receipt error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
