"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { ClipboardList, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GudangReportPage() {
  const [stockOut, setStockOut] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setStockOut(await api.getStockOutReport());
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalOut = stockOut.reduce((sum, s) => sum + (s.qty || 0), 0);

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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Laporan Gudang</h1>
          <p className="text-muted-foreground mt-1">Ringkasan barang keluar</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="cursor-pointer print:hidden">
          <Printer className="w-4 h-4 mr-1" /> Cetak
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Barang Keluar</p>
          <p className="text-3xl font-bold mt-1 text-primary">{totalOut} unit</p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                <th className="text-left py-3 px-4 font-medium">Nota</th>
                <th className="text-left py-3 px-4 font-medium">Item</th>
                <th className="text-center py-3 px-4 font-medium">Qty</th>
                <th className="text-left py-3 px-4 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {stockOut.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                stockOut.map((item) => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{item.notaNumber || "—"}</td>
                    <td className="py-3 px-4">{item.menuItemId?.slice(0, 8)}...</td>
                    <td className="py-3 px-4 text-center font-semibold">{item.qty}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.notes || "—"}</td>
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
