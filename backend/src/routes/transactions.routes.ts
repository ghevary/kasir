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
import { snap } from "../config/midtrans";
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

        if ((menuItem.stockQty || 0) < item.qty) {
          res.status(400).json({
            error: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.stockQty}`,
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

      // For QRIS (Midtrans), create Snap token
      let midtransOrderId: string | undefined;
      let midtransToken: string | undefined;

      if (paymentMethod === "qris") {
        midtransOrderId = `POS-${Date.now()}-${uuidv4().slice(0, 8)}`;

        try {
          const snapResponse = await snap.createTransaction({
            transaction_details: {
              order_id: midtransOrderId,
              gross_amount: totalAmount,
            },
            customer_details: {
              first_name: customerName || "Umum",
            },
            item_details: itemDetails.map((i) => ({
              id: i.menuItemId,
              price: parseFloat(i.unitPrice),
              quantity: i.qty,
              name: i.name,
            })),
          });

          midtransToken = snapResponse.token;
        } catch (midtransError) {
          console.error("Midtrans error:", midtransError);
          // If Midtrans is not configured, continue with manual QRIS
          midtransOrderId = `POS-${Date.now()}`;
        }
      }

      // Create transaction
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
          status: paymentMethod === "cash" ? "completed" : "pending",
          midtransOrderId,
          midtransToken,
        })
        .returning();

      // Create transaction items & deduct stock
      for (const item of itemDetails) {
        await db.insert(transactionItems).values({
          transactionId: transaction.id,
          menuItemId: item.menuItemId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });

        // Deduct stock atomically
        await db
          .update(menuItems)
          .set({
            stockQty: sql`GREATEST(${menuItems.stockQty} - ${item.qty}, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(menuItems.id, item.menuItemId));
      }

      res.status(201).json({
        transaction,
        items: itemDetails,
        midtransToken,
        midtransOrderId,
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
      const { from, to } = req.query;
      let query = db.select().from(transactions).orderBy(desc(transactions.createdAt));
      // Date filtering handled client-side for simplicity
      const result = await query;
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

// POST /api/transactions/midtrans-webhook — Midtrans notification handler
router.post("/midtrans-webhook", async (req: Request, res: Response) => {
  try {
    const { order_id, transaction_status, fraud_status } = req.body;

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      if (!fraud_status || fraud_status === "accept") {
        await db
          .update(transactions)
          .set({ status: "completed" })
          .where(eq(transactions.midtransOrderId, order_id));
      }
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      await db
        .update(transactions)
        .set({ status: "cancelled" })
        .where(eq(transactions.midtransOrderId, order_id));
    }

    res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
