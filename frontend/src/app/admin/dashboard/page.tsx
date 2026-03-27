"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { MenuItem } from "@/types";
import { Banknote, Receipt, AlertTriangle, Package } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    lowStockItems: 0,
    activeItems: 0,
  });
  const [stockItems, setStockItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [stockData, salesData] = await Promise.all([
        api.getStockMonitor().catch(() => []),
        api.getSalesReport().catch(() => ({ summary: { totalRevenue: 0, totalTransactions: 0 } })),
      ]);

      setStockItems(stockData.slice(0, 10));
      setStats({
        totalRevenue: salesData.summary?.totalRevenue || 0,
        totalTransactions: salesData.summary?.totalTransactions || 0,
        lowStockItems: stockData.filter(
          (i: any) => i.stockQty <= (i.stockAlertThreshold || 5)
        ).length,
        activeItems: stockData.filter((i: any) => i.isAvailable).length,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const getStockBadge = (item: MenuItem) => {
    if (item.stockQty <= 0) return <Badge variant="destructive">Habis</Badge>;
    if (item.stockQty <= (item.stockAlertThreshold || 5))
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Rendah</Badge>;
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Aman</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Ringkasan operasional bisnis hari ini
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          {
            title: "Revenue Hari Ini",
            value: formatRupiah(stats.totalRevenue),
            icon: <Banknote className="w-6 h-6 text-emerald-500" />,
            color: "from-emerald-500/20 to-emerald-500/5",
          },
          {
            title: "Total Transaksi",
            value: stats.totalTransactions.toString(),
            icon: <Receipt className="w-6 h-6 text-blue-500" />,
            color: "from-blue-500/20 to-blue-500/5",
          },
          {
            title: "Stok Rendah",
            value: stats.lowStockItems.toString(),
            icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
            color: "from-yellow-500/20 to-yellow-500/5",
          },
          {
            title: "Item Aktif",
            value: stats.activeItems.toString(),
            icon: <Package className="w-6 h-6 text-purple-500" />,
            color: "from-purple-500/20 to-purple-500/5",
          },
        ].map((stat) => (
          <Card
            key={stat.title}
            className="border-border/50 bg-gradient-to-br card-hover cursor-default"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl`}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stock Monitor Table */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Stok Monitor (Real-time)</CardTitle>
          <a
            href="/admin/stock/monitor"
            className="text-sm text-primary hover:underline"
          >
            Lihat Semua →
          </a>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Item</th>
                  <th className="text-center py-3 px-4 font-medium">Stok</th>
                  <th className="text-center py-3 px-4 font-medium">Threshold</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada data stok
                    </td>
                  </tr>
                ) : (
                  stockItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/30 table-row-hover transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-center">{item.stockQty}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {item.stockAlertThreshold}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStockBadge(item)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
