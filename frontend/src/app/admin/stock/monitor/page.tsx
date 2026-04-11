"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { MenuItem } from "@/types";
import { AlertTriangle, CheckCircle, Package, Activity, XCircle, Warehouse, Store, Printer } from "lucide-react";

export default function AdminStockMonitorPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { setItems(await api.getStockMonitor()); } catch {} finally { setLoading(false); }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStockBadge = (qty: number, threshold: number) => {
    if (qty <= 0) return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1 inline" /> Habis</Badge>;
    if (qty <= threshold)
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1 inline" /> Rendah</Badge>;
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1 inline" /> Aman</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>;

  const totalWarehouse = items.reduce((sum, i) => sum + (i.warehouseQty || 0), 0);
  const totalOutlet = items.reduce((sum, i) => sum + (i.outletQty || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Package className="w-6 h-6" /> Stok Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">Gudang & Outlet — auto-refresh setiap 5 detik</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="animate-pulse flex items-center gap-1"><Activity className="w-3 h-3 text-red-500" /> Live</Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="cursor-pointer print:hidden">
            <Printer className="w-4 h-4 mr-1" /> Cetak
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Warehouse className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">Total Stok Gudang</p>
              <p className="text-2xl font-bold">{totalWarehouse}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Store className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-xs text-muted-foreground">Total Stok Outlet</p>
              <p className="text-2xl font-bold">{totalOutlet}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="w-8 h-8 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground">Total Semua</p>
              <p className="text-2xl font-bold">{totalWarehouse + totalOutlet}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left py-3 px-4 font-medium">Item</th>
              <th className="text-center py-3 px-4 font-medium">Stok Gudang</th>
              <th className="text-center py-3 px-4 font-medium">Stok Outlet</th>
              <th className="text-center py-3 px-4 font-medium">Total</th>
              <th className="text-center py-3 px-4 font-medium">Threshold</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-400">{item.warehouseQty || 0}</td>
                  <td className="py-3 px-4 text-center font-semibold text-emerald-400">{item.outletQty || 0}</td>
                  <td className="py-3 px-4 text-center font-semibold">{(item.warehouseQty || 0) + (item.outletQty || 0)}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{item.stockAlertThreshold}</td>
                  <td className="py-3 px-4 text-center">{getStockBadge((item.warehouseQty || 0) + (item.outletQty || 0), item.stockAlertThreshold || 5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
