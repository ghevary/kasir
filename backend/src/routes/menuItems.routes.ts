import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { menuItems, categories } from "../db/schema";
import { eq } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/menu-items
router.get("/", async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.category as string;
    const result = categoryId
      ? await db
          .select()
          .from(menuItems)
          .where(eq(menuItems.categoryId, categoryId))
      : await db.select().from(menuItems);
    res.json(result);
  } catch (error) {
    console.error("Get menu items error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/menu-items/active (for POS)
router.get("/active", async (req: Request, res: Response) => {
  try {
    const result = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.isAvailable, true));
    res.json(result);
  } catch (error) {
    console.error("Get active menu items error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/menu-items [Admin]
router.post(
  "/",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const { categoryId, name, description, price, stockQty, stockAlertThreshold, imageUrl } = req.body;
      if (!name || !price) {
        res.status(400).json({ error: "Name and price are required" });
        return;
      }
      const [created] = await db
        .insert(menuItems)
        .values({ categoryId, name, description, price, stockQty, stockAlertThreshold, imageUrl })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error("Create menu item error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/menu-items/:id [Admin]
router.put(
  "/:id",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const { categoryId, name, description, price, stockQty, stockAlertThreshold, imageUrl, isAvailable } = req.body;
      const [updated] = await db
        .update(menuItems)
        .set({ categoryId, name, description, price, stockQty, stockAlertThreshold, imageUrl, isAvailable, updatedAt: new Date() })
        .where(eq(menuItems.id, req.params.id as string))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Update menu item error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/menu-items/:id (soft delete) [Admin]
router.delete(
  "/:id",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const [deleted] = await db
        .update(menuItems)
        .set({ isAvailable: false, updatedAt: new Date() })
        .where(eq(menuItems.id, req.params.id as string))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }
      res.json({ message: "Menu item deactivated", menuItem: deleted });
    } catch (error) {
      console.error("Delete menu item error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
