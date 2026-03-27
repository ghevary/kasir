"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { MenuItem } from "@/types";
import { AlertTriangle, CheckCircle, Package, Activity, XCircle } from "lucide-react";

export default function AdminStockMonitorPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { setItems(await api.getStockMonitor()); } catch {} finally { setLoading(false); }
    };
    load();
    const interval = setInterval(load, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStockBadge = (item: MenuItem) => {
    if (item.stockQty <= 0) return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1 inline" /> Habis</Badge>;
    if (item.stockQty <= (item.stockAlertThreshold || 5))
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1 inline" /> Rendah</Badge>;
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1 inline" /> Aman</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Package className="w-6 h-6" /> Stok Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">Auto-refresh setiap 5 detik</p>
        </div>
        <Badge variant="outline" className="animate-pulse flex items-center gap-1"><Activity className="w-3 h-3 text-red-500" /> Live</Badge>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left py-3 px-4 font-medium">Item</th>
              <th className="text-center py-3 px-4 font-medium">Stok</th>
              <th className="text-center py-3 px-4 font-medium">Threshold</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-center font-semibold">{item.stockQty}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{item.stockAlertThreshold}</td>
                  <td className="py-3 px-4 text-center">{getStockBadge(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
