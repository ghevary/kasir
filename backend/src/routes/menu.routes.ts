import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { categories } from "../db/schema";
import { eq } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/categories
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(categories);
    res.json(result);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/categories [Admin]
router.post(
  "/",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        res.status(400).json({ error: "Name is required" });
        return;
      }
      const [created] = await db
        .insert(categories)
        .values({ name, description })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/categories/:id [Admin]
router.put(
  "/:id",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const { name, description, isActive } = req.body;
      const [updated] = await db
        .update(categories)
        .set({ name, description, isActive })
        .where(eq(categories.id, req.params.id as string))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/categories/:id (soft delete) [Admin]
router.delete(
  "/:id",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const [deleted] = await db
        .update(categories)
        .set({ isActive: false })
        .where(eq(categories.id, req.params.id as string))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json({ message: "Category deactivated", category: deleted });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
