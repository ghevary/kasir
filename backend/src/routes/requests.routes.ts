import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { stockRequests, stockOut, menuItems } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";

const router = Router();

// POST /api/stock-requests — create request [Kasir]
// Supports bulk: { items: [{ menuItemId, requestedQty, notes }] }
router.post(
  "/",
  rbacMiddleware("kasir"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { items } = req.body; // Array of { menuItemId, requestedQty, notes }

      if (!items || items.length === 0) {
        res.status(400).json({ error: "Items are required" });
        return;
      }

      const created = [];
      for (const item of items) {
        const [request] = await db
          .insert(stockRequests)
          .values({
            kasirId: user.id,
            menuItemId: item.menuItemId,
            requestedQty: item.requestedQty,
            notes: item.notes,
          })
          .returning();
        created.push(request);
      }

      res.status(201).json(created);
    } catch (error) {
      console.error("Create request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/stock-requests
router.get(
  "/",
  rbacMiddleware("kasir", "gudang", "admin"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      let result;
      if (user.role === "kasir") {
        result = await db
          .select()
          .from(stockRequests)
          .where(eq(stockRequests.kasirId, user.id))
          .orderBy(desc(stockRequests.createdAt));
      } else {
        result = await db
          .select()
          .from(stockRequests)
          .orderBy(desc(stockRequests.createdAt));
      }

      res.json(result);
    } catch (error) {
      console.error("Get requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/stock-requests/:id
router.get(
  "/:id",
  rbacMiddleware("kasir", "gudang", "admin"),
  async (req: Request, res: Response) => {
    try {
      const [request] = await db
        .select()
        .from(stockRequests)
        .where(eq(stockRequests.id, req.params.id as string));

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }
      res.json(request);
    } catch (error) {
      console.error("Get request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/stock-requests/:id/approve [Gudang]
router.put(
  "/:id/approve",
  rbacMiddleware("gudang"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { approvedQty } = req.body;

      // Get the request first to check warehouse stock
      const [request] = await db
        .select()
        .from(stockRequests)
        .where(eq(stockRequests.id, req.params.id as string));

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      const qty = approvedQty || request.requestedQty;

      // Check warehouse stock
      const [item] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, request.menuItemId));

      if (!item) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }

      if ((item.warehouseQty || 0) < qty) {
        res.status(400).json({
          error: `Stok gudang tidak cukup. Tersedia: ${item.warehouseQty}`,
        });
        return;
      }

      // Update request status to approved
      const [updated] = await db
        .update(stockRequests)
        .set({
          status: "approved",
          gudangId: user.id,
          approvedQty: qty,
          updatedAt: new Date(),
        })
        .where(eq(stockRequests.id, req.params.id as string))
        .returning();

      // Transfer stock: warehouse ↓, outlet ↑
      await db
        .update(menuItems)
        .set({
          warehouseQty: sql`GREATEST(${menuItems.warehouseQty} - ${qty}, 0)`,
          outletQty: sql`${menuItems.outletQty} + ${qty}`,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, request.menuItemId));

      // Create stock out record
      const notaNumber = `NBO-${Date.now()}`;
      await db.insert(stockOut).values({
        menuItemId: request.menuItemId,
        gudangId: user.id,
        stockRequestId: request.id,
        qty,
        notaNumber,
        notes: `Approved & transferred to outlet from request`,
      });

      // Mark as fulfilled
      await db
        .update(stockRequests)
        .set({ status: "fulfilled", updatedAt: new Date() })
        .where(eq(stockRequests.id, request.id));

      res.json({ ...updated, status: "fulfilled" });
    } catch (error) {
      console.error("Approve request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/stock-requests/:id/reject [Gudang]
router.put(
  "/:id/reject",
  rbacMiddleware("gudang"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { notes } = req.body;

      const [updated] = await db
        .update(stockRequests)
        .set({
          status: "rejected",
          gudangId: user.id,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(stockRequests.id, req.params.id as string))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Request not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Reject request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
