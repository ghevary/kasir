import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { users } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";
import bcrypt from "bcrypt";

const router = Router();

// GET /api/users — list all users [Admin]
router.get(
  "/",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const result = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/users — create new user [Admin]
router.post(
  "/",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ error: "Semua field wajib diisi" });
        return;
      }

      if (!["admin", "kasir", "gudang"].includes(role)) {
        res.status(400).json({ error: "Role tidak valid" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [newUser] = await db
        .insert(users)
        .values({ name, email, passwordHash, role })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });

      res.status(201).json(newUser);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Email sudah terdaftar" });
        return;
      }
      console.error("Create user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /api/users/:id — update user [Admin]
router.put(
  "/:id",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const { name, email, role, password, isActive } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (typeof isActive === "boolean") updateData.isActive = isActive;
      if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.params.id as string))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });

      if (!updated) {
        res.status(404).json({ error: "User tidak ditemukan" });
        return;
      }

      res.json(updated);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Email sudah terdaftar" });
        return;
      }
      console.error("Update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/users/:id — deactivate user [Admin]
router.delete(
  "/:id",
  rbacMiddleware("admin"),
  async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;

      // Prevent self-deactivation
      if (currentUser.id === req.params.id) {
        res.status(400).json({ error: "Tidak dapat menonaktifkan akun sendiri" });
        return;
      }

      const [updated] = await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, req.params.id as string))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "User tidak ditemukan" });
        return;
      }

      res.json({ message: "User berhasil dinonaktifkan" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
