"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { BarChart, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KasirDailyReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setData(await api.getDailySalesReport());
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const totalQtySold = data.reduce((sum, d) => sum + (d.totalQty || 0), 0);
  const totalAmountSold = data.reduce(
    (sum, d) => sum + parseFloat(d.totalAmount || "0"),
    0
  );

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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BarChart className="w-6 h-6" /> Laporan Harian</h1>
          <p className="text-muted-foreground mt-1">
            Ringkasan penjualan per item hari ini ({new Date().toLocaleDateString("id-ID")})
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="cursor-pointer print:hidden">
          <Printer className="w-4 h-4 mr-1" /> Cetak
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Item Terjual</p>
            <p className="text-2xl font-bold mt-1">{totalQtySold}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Pendapatan</p>
            <p className="text-2xl font-bold mt-1 text-primary">
              {formatRupiah(totalAmountSold)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-item breakdown */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Menu Item</th>
                <th className="text-center py-3 px-4 font-medium">Qty Terjual</th>
                <th className="text-right py-3 px-4 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-muted-foreground">
                    Belum ada penjualan hari ini
                  </td>
                </tr>
              ) : (
                data.map((d, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{d.menuItemName}</td>
                    <td className="py-3 px-4 text-center font-semibold">{d.totalQty}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">
                      {formatRupiah(parseFloat(d.totalAmount || "0"))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
