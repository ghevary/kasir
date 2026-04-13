import { Router, Request, Response } from "express";
import { db } from "../config/db";
import { transactions, transactionItems, menuItems, shifts } from "../db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { rbacMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * Weighted Moving Average (WMA) Forecasting
 * Based on journal: "Sistem Informasi Peramalan Penjualan Keripik
 * Menggunakan Metode Weighted Moving Average"
 *
 * Formula: Ft = (Wn × At-1 + Wn-1 × At-2 + ... + W1 × At-n) / (Wn + Wn-1 + ... + W1)
 * - Data terbaru mendapat bobot terbesar
 * - Bobot: 1 (terlama) sampai n (terbaru)
 *
 * MSE = Σ(Error²) / n
 */

interface DailySales {
  date: string;
  totalQty: number;
}

function calculateWMA(data: number[], period: number): number | null {
  if (data.length < period) return null;

  const recentData = data.slice(-period);
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < period; i++) {
    const weight = i + 1; // 1 (oldest) to period (newest)
    weightedSum += recentData[i] * weight;
    totalWeight += weight;
  }

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

function calculateMSE(
  actualData: number[],
  period: number
): { mse: number; forecasts: { actual: number; forecast: number; error: number }[] } {
  const forecasts: { actual: number; forecast: number; error: number }[] = [];

  for (let i = period; i < actualData.length; i++) {
    const dataForForecast = actualData.slice(0, i);
    const forecast = calculateWMA(dataForForecast, period);
    if (forecast !== null) {
      const error = Math.pow(actualData[i] - forecast, 2);
      forecasts.push({
        actual: actualData[i],
        forecast,
        error,
      });
    }
  }

  const mse =
    forecasts.length > 0
      ? Math.round(
          (forecasts.reduce((sum, f) => sum + f.error, 0) / forecasts.length) *
            100
        ) / 100
      : 0;

  return { mse, forecasts };
}

// GET /api/forecast — forecast for all menu items
router.get(
  "/",
  rbacMiddleware("admin", "kasir"),
  async (req: Request, res: Response) => {
    try {
      const period = parseInt(req.query.period as string) || 10;
      const days = parseInt(req.query.days as string) || 30; // look back days

      // Get all menu items
      const items = await db.select().from(menuItems);

      // Get daily sales data for the last N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const salesData = await db
        .select({
          menuItemId: transactionItems.menuItemId,
          date: sql<string>`DATE(${transactions.createdAt})`,
          totalQty: sql<number>`SUM(${transactionItems.qty})::int`,
        })
        .from(transactionItems)
        .innerJoin(
          transactions,
          eq(transactionItems.transactionId, transactions.id)
        )
        .where(
          and(
            eq(transactions.status, "completed"),
            gte(transactions.createdAt, startDate)
          )
        )
        .groupBy(transactionItems.menuItemId, sql`DATE(${transactions.createdAt})`)
        .orderBy(sql`DATE(${transactions.createdAt})`);

      // Group sales by menu item
      const salesByItem: Record<string, DailySales[]> = {};
      for (const sale of salesData) {
        if (!salesByItem[sale.menuItemId]) {
          salesByItem[sale.menuItemId] = [];
        }
        salesByItem[sale.menuItemId].push({
          date: sale.date,
          totalQty: sale.totalQty,
        });
      }

      // Calculate WMA forecast for each item
      const results = items.map((item) => {
        const itemSales = salesByItem[item.id] || [];
        const quantities = itemSales.map((s) => s.totalQty);

        const forecast = calculateWMA(quantities, Math.min(period, quantities.length));
        const { mse, forecasts } = calculateMSE(quantities, Math.min(period, quantities.length));

        return {
          menuItemId: item.id,
          menuItemName: item.name,
          warehouseQty: item.warehouseQty,
          outletQty: item.outletQty,
          period: Math.min(period, quantities.length),
          totalDataPoints: quantities.length,
          dailySales: itemSales,
          forecast: forecast !== null ? Math.round(forecast) : null,
          mse,
          forecastDetails: forecasts,
        };
      });

      res.json({
        period,
        lookbackDays: days,
        items: results,
      });
    } catch (error) {
      console.error("Forecast error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/forecast/:menuItemId — detail forecast for 1 item
router.get(
  "/:menuItemId",
  rbacMiddleware("admin", "kasir"),
  async (req: Request, res: Response) => {
    try {
      const menuItemId = req.params.menuItemId as string;
      const period = parseInt(req.query.period as string) || 10;
      const days = parseInt(req.query.days as string) || 30;

      const [item] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, menuItemId));

      if (!item) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const salesData = await db
        .select({
          date: sql<string>`DATE(${transactions.createdAt})`,
          totalQty: sql<number>`SUM(${transactionItems.qty})::int`,
        })
        .from(transactionItems)
        .innerJoin(
          transactions,
          eq(transactionItems.transactionId, transactions.id)
        )
        .where(
          and(
            eq(transactionItems.menuItemId, menuItemId),
            eq(transactions.status, "completed"),
            gte(transactions.createdAt, startDate)
          )
        )
        .groupBy(sql`DATE(${transactions.createdAt})`)
        .orderBy(sql`DATE(${transactions.createdAt})`);

      const quantities = salesData.map((s) => s.totalQty);
      const usedPeriod = Math.min(period, quantities.length);
      const forecast = calculateWMA(quantities, usedPeriod);
      const { mse, forecasts } = calculateMSE(quantities, usedPeriod);

      // Build weights explanation
      const weights = [];
      if (quantities.length >= usedPeriod) {
        const recentData = quantities.slice(-usedPeriod);
        const recentDates = salesData.slice(-usedPeriod);
        for (let i = 0; i < usedPeriod; i++) {
          weights.push({
            date: recentDates[i].date,
            value: recentData[i],
            weight: i + 1,
            weighted: recentData[i] * (i + 1),
          });
        }
      }

      const totalWeight = (usedPeriod * (usedPeriod + 1)) / 2;

      res.json({
        menuItem: {
          id: item.id,
          name: item.name,
          warehouseQty: item.warehouseQty,
          outletQty: item.outletQty,
        },
        period: usedPeriod,
        totalDataPoints: quantities.length,
        dailySales: salesData,
        weights,
        totalWeight,
        forecast: forecast !== null ? Math.round(forecast) : null,
        forecastRaw: forecast,
        mse,
        forecastDetails: forecasts,
      });
    } catch (error) {
      console.error("Forecast detail error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/forecast/outlet — shift-based forecast for outlet stock [Kasir]
// Each closed shift = 1 data point
router.get(
  "/outlet",
  rbacMiddleware("kasir", "admin"),
  async (req: Request, res: Response) => {
    try {
      const period = parseInt(req.query.period as string) || 10;
      const shiftCount = parseInt(req.query.shifts as string) || 30;

      // Get all menu items
      const items = await db.select().from(menuItems);

      // Get last N closed shifts (ordered by endedAt)
      const closedShifts = await db
        .select()
        .from(shifts)
        .where(eq(shifts.status, "closed"))
        .orderBy(desc(shifts.endedAt))
        .limit(shiftCount);

      // Reverse to chronological order (oldest first)
      closedShifts.reverse();

      if (closedShifts.length === 0) {
        res.json({
          period,
          totalShifts: 0,
          items: items.map((item) => ({
            menuItemId: item.id,
            menuItemName: item.name,
            outletQty: item.outletQty,
            period: 0,
            totalDataPoints: 0,
            shiftSales: [],
            forecast: null,
            mse: 0,
            forecastDetails: [],
          })),
        });
        return;
      }

      const shiftIds = closedShifts.map((s) => s.id);

      // Get sales data aggregated per shift per menu item
      const salesData = await db
        .select({
          menuItemId: transactionItems.menuItemId,
          shiftId: transactions.shiftId,
          totalQty: sql<number>`SUM(${transactionItems.qty})::int`,
        })
        .from(transactionItems)
        .innerJoin(
          transactions,
          eq(transactionItems.transactionId, transactions.id)
        )
        .where(
          and(
            eq(transactions.status, "completed"),
            sql`${transactions.shiftId} IN (${sql.join(
              shiftIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        )
        .groupBy(transactionItems.menuItemId, transactions.shiftId);

      // Group sales by menu item, maintaining shift order
      const salesByItem: Record<string, { shiftId: string; shiftIndex: number; totalQty: number }[]> = {};
      for (const sale of salesData) {
        if (!sale.shiftId) continue;
        if (!salesByItem[sale.menuItemId]) {
          salesByItem[sale.menuItemId] = [];
        }
        const shiftIndex = shiftIds.indexOf(sale.shiftId);
        if (shiftIndex >= 0) {
          salesByItem[sale.menuItemId].push({
            shiftId: sale.shiftId,
            shiftIndex,
            totalQty: sale.totalQty,
          });
        }
      }

      // Build shift info map for display
      const shiftInfoMap: Record<string, { startedAt: Date | null; endedAt: Date | null }> = {};
      for (const s of closedShifts) {
        shiftInfoMap[s.id] = { startedAt: s.startedAt, endedAt: s.endedAt };
      }

      // Calculate WMA forecast for each item
      const results = items.map((item) => {
        const itemSales = salesByItem[item.id] || [];
        // Sort by shift index (chronological)
        itemSales.sort((a, b) => a.shiftIndex - b.shiftIndex);

        // Fill in zeros for shifts with no sales of this item
        const quantitiesByShift: number[] = shiftIds.map((sid) => {
          const found = itemSales.find((s) => s.shiftId === sid);
          return found ? found.totalQty : 0;
        });

        // Build shift sales detail for UI
        const shiftSales = shiftIds.map((sid, idx) => ({
          shiftId: sid,
          startedAt: shiftInfoMap[sid]?.startedAt,
          endedAt: shiftInfoMap[sid]?.endedAt,
          totalQty: quantitiesByShift[idx],
        }));

        const usedPeriod = Math.min(period, quantitiesByShift.length);
        const forecast = usedPeriod > 0 ? calculateWMA(quantitiesByShift, usedPeriod) : null;
        const { mse, forecasts } = usedPeriod > 0
          ? calculateMSE(quantitiesByShift, usedPeriod)
          : { mse: 0, forecasts: [] };

        return {
          menuItemId: item.id,
          menuItemName: item.name,
          outletQty: item.outletQty,
          period: usedPeriod,
          totalDataPoints: closedShifts.length,
          shiftSales,
          forecast: forecast !== null ? Math.round(forecast) : null,
          mse,
          forecastDetails: forecasts,
        };
      });

      res.json({
        period,
        totalShifts: closedShifts.length,
        items: results,
      });
    } catch (error) {
      console.error("Outlet forecast error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
