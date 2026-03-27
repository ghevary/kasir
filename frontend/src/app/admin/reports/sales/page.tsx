"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { ClipboardList } from "lucide-react";

export default function AdminSalesReportPage() {
  const [data, setData] = useState<any>({ transactions: [], summary: {} });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setData(await api.getSalesReport(from || undefined, to || undefined)); } catch {} finally { setLoading(false); }
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Laporan Penjualan</h1>
      <div className="flex gap-3 items-end">
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Dari</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-background/50" /></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Sampai</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-background/50" /></div>
        <button onClick={load} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Terapkan</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/50"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Transaksi</p><p className="text-2xl font-bold mt-1">{data.summary?.totalTransactions || 0}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold mt-1 text-primary">{formatRupiah(data.summary?.totalRevenue || 0)}</p></CardContent></Card>
      </div>
      <Card className="border-border/50"><CardContent className="p-0">
        <table className="w-full text-sm"><thead><tr className="border-b border-border/50 text-muted-foreground">
          <th className="text-left py-3 px-4 font-medium">Tanggal</th><th className="text-left py-3 px-4 font-medium">Pelanggan</th><th className="text-center py-3 px-4 font-medium">Metode</th><th className="text-right py-3 px-4 font-medium">Total</th>
        </tr></thead><tbody>
          {(data.transactions || []).map((tx: any) => (
            <tr key={tx.id} className="border-b border-border/30 hover:bg-accent/30">
              <td className="py-3 px-4">{new Date(tx.createdAt).toLocaleDateString("id-ID")}</td>
              <td className="py-3 px-4">{tx.customerName}</td>
              <td className="py-3 px-4 text-center uppercase text-xs font-semibold">{tx.paymentMethod}</td>
              <td className="py-3 px-4 text-right font-semibold text-primary">{formatRupiah(parseFloat(tx.totalAmount))}</td>
            </tr>
          ))}
        </tbody></table>
      </CardContent></Card>
    </div>
  );
}
