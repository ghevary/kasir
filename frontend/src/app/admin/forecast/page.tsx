"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { BarChart, TrendingUp, Package, Calculator, Printer } from "lucide-react";

interface ForecastItem {
  menuItemId: string;
  menuItemName: string;
  warehouseQty: number;
  outletQty: number;
  period: number;
  totalDataPoints: number;
  forecast: number | null;
  mse: number;
}

export default function AdminForecastPage() {
  const [data, setData] = useState<{ period: number; items: ForecastItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(10);
  const [days, setDays] = useState(30);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.getForecast(period, days);
      setData(result);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> Peramalan Penjualan (WMA)
          </h1>
          <p className="text-muted-foreground mt-1">
            Weighted Moving Average — prediksi kebutuhan stok berdasarkan riwayat penjualan
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="cursor-pointer print:hidden">
          <Printer className="w-4 h-4 mr-2" /> Cetak
        </Button>
      </div>

      {/* Parameters */}
      <Card className="border-border/50 print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Parameter Peramalan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode WMA (hari)</label>
              <Input
                type="number"
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value) || 10)}
                className="w-32 bg-background/50"
                min={2}
                max={30}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Historis (hari)</label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                className="w-32 bg-background/50"
                min={7}
                max={365}
              />
            </div>
            <Button onClick={load} className="bg-primary cursor-pointer">
              <BarChart className="w-4 h-4 mr-2" /> Hitung Peramalan
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <strong>Rumus WMA:</strong> Ft = (Wn × At-1 + Wn-1 × At-2 + ... + W1 × At-n) / (Wn + Wn-1 + ... + W1)
            <br />
            Bobot: data terbaru mendapat bobot terbesar (W=n), data terlama mendapat bobot terkecil (W=1)
          </p>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Periode WMA</p>
            <p className="text-2xl font-bold">{period} hari</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Item Menu</p>
            <p className="text-2xl font-bold">{data?.items.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Item Dengan Data</p>
            <p className="text-2xl font-bold">
              {data?.items.filter((i) => i.totalDataPoints > 0).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Hasil Peramalan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Menu Item</th>
                <th className="text-center py-3 px-4 font-medium">Stok Gudang</th>
                <th className="text-center py-3 px-4 font-medium">Stok Outlet</th>
                <th className="text-center py-3 px-4 font-medium">Data (hari)</th>
                <th className="text-center py-3 px-4 font-medium">Prediksi Besok</th>
                <th className="text-center py-3 px-4 font-medium">MSE</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => {
                const needsStock = item.forecast !== null && item.forecast > (item.outletQty || 0);
                const hasData = item.totalDataPoints > 0;

                return (
                  <tr
                    key={item.menuItemId}
                    className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{item.menuItemName}</td>
                    <td className="py-3 px-4 text-center">{item.warehouseQty || 0}</td>
                    <td className="py-3 px-4 text-center">{item.outletQty || 0}</td>
                    <td className="py-3 px-4 text-center">
                      {hasData ? item.totalDataPoints : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.forecast !== null ? (
                        <span className="font-bold text-primary">{item.forecast} pcs</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.mse > 0 ? (
                        <span className="text-muted-foreground">{item.mse.toFixed(2)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!hasData ? (
                        <Badge className="bg-gray-500/20 text-gray-400">Belum Ada Data</Badge>
                      ) : needsStock ? (
                        <Badge className="bg-red-500/20 text-red-400">Perlu Request</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400">Aman</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-muted-foreground mt-8">
        <p>Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
        <p>Metode: Weighted Moving Average (WMA) — Periode: {period} hari</p>
      </div>
    </div>
  );
}
