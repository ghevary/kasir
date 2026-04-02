import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/auth.middleware";

// Routes
import authRoutes from "./routes/auth.routes";
import menuRoutes from "./routes/menu.routes";
import menuItemsRoutes from "./routes/menuItems.routes";
import stockRoutes from "./routes/stock.routes";
import transactionsRoutes from "./routes/transactions.routes";
import shiftsRoutes from "./routes/shifts.routes";
import requestsRoutes from "./routes/requests.routes";
import reportsRoutes from "./routes/reports.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "POS System Backend is running!" });
});

// Public routes
app.use("/api/auth", authRoutes);


// Protected routes (require authentication)
app.use("/api/categories", authMiddleware, menuRoutes);
app.use("/api/menu-items", authMiddleware, menuItemsRoutes);
app.use("/api/stock", authMiddleware, stockRoutes);
app.use("/api/transactions", authMiddleware, transactionsRoutes);
app.use("/api/shifts", authMiddleware, shiftsRoutes);
app.use("/api/stock-requests", authMiddleware, requestsRoutes);
app.use("/api/reports", authMiddleware, reportsRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`🚀 POS System Backend running on port ${port}`);
});

export default app;
