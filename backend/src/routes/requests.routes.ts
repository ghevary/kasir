import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { stockRequests, stockOut, menuItems } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";

const router = Router();

// POST /api/stock-requests — create request [Kasir]
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
      const status = req.query.status as string;

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

      const [updated] = await db
        .update(stockRequests)
        .set({
          status: "approved",
          gudangId: user.id,
          approvedQty,
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

// POST /api/stock-requests/:id/fulfill [Gudang]
router.post(
  "/:id/fulfill",
  rbacMiddleware("gudang"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const [request] = await db
        .select()
        .from(stockRequests)
        .where(eq(stockRequests.id, req.params.id as string));

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      if (request.status !== "approved") {
        res.status(400).json({ error: "Request must be approved first" });
        return;
      }

      const qty = request.approvedQty || request.requestedQty;
      const notaNumber = `NBO-${Date.now()}`;

      // Create stock out record
      const [stockOutRecord] = await db
        .insert(stockOut)
        .values({
          menuItemId: request.menuItemId,
          gudangId: user.id,
          stockRequestId: request.id,
          qty,
          notaNumber,
          notes: `Fulfilled from request ${request.id}`,
        })
        .returning();

      // Deduct stock
      await db
        .update(menuItems)
        .set({
          stockQty: sql`GREATEST(${menuItems.stockQty} - ${qty}, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, request.menuItemId));

      // Update request status
      await db
        .update(stockRequests)
        .set({ status: "fulfilled", updatedAt: new Date() })
        .where(eq(stockRequests.id, request.id));

      res.json({ stockOut: stockOutRecord, notaNumber });
    } catch (error) {
      console.error("Fulfill request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
