"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Upload } from "lucide-react";

export default function AdminStockOutReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setData(await api.getStockOutReport(from || undefined, to || undefined));
    } catch {} finally {
      setLoading(false);
    }
  };

  const totalQty = data.reduce((sum, d) => sum + (d.qty || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Upload className="w-6 h-6" /> Laporan Stok Keluar</h1>
      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Dari</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-background/50" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Sampai</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-background/50" />
        </div>
        <button onClick={load} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer">
          Terapkan
        </button>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Barang Keluar</p>
          <p className="text-2xl font-bold mt-1 text-red-400">{totalQty} unit</p>
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
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                data.map((item) => (
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
