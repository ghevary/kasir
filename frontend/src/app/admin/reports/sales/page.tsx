"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { ClipboardList, Coins, Banknote, Smartphone, TrendingUp, Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "penjualan" | "keuangan";

export default function AdminReportsPage() {
  const [salesData, setSalesData] = useState<any>({ transactions: [], summary: {} });
  const [finData, setFinData] = useState<any>({ transactions: [], summary: {} });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("penjualan");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [sales, fin] = await Promise.all([
        api.getSalesReport(from || undefined, to || undefined),
        api.getFinancialReport(from || undefined, to || undefined),
      ]);
      setSalesData(sales);
      setFinData(fin);
    } catch {} finally { setLoading(false); }
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Laporan</h1>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="cursor-pointer print:hidden">
          <Printer className="w-4 h-4 mr-1" /> Cetak Laporan
        </Button>
      </div>

      {/* Date filter */}
      <div className="flex gap-3 items-end">
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Dari</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-background/50" /></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Sampai</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-background/50" /></div>
        <button onClick={load} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer">Terapkan</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-accent/30 w-fit">
        <button
          onClick={() => setActiveTab("penjualan")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${activeTab === "penjualan" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Receipt className="w-4 h-4" /> Penjualan
        </button>
        <button
          onClick={() => setActiveTab("keuangan")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${activeTab === "keuangan" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Coins className="w-4 h-4" /> Keuangan
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "penjualan" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/50"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Transaksi</p><p className="text-2xl font-bold mt-1">{salesData.summary?.totalTransactions || 0}</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Total Revenue</p><p className="text-2xl font-bold mt-1 text-primary">{formatRupiah(salesData.summary?.totalRevenue || 0)}</p></CardContent></Card>
          </div>
          <Card className="border-border/50"><CardContent className="p-0">
            <table className="w-full text-sm"><thead><tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left py-3 px-4 font-medium">Tanggal</th><th className="text-left py-3 px-4 font-medium">Pelanggan</th><th className="text-center py-3 px-4 font-medium">Metode</th><th className="text-right py-3 px-4 font-medium">Total</th>
            </tr></thead><tbody>
              {(salesData.transactions || []).map((tx: any) => (
                <tr key={tx.id} className="border-b border-border/30 hover:bg-accent/30">
                  <td className="py-3 px-4">{new Date(tx.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="py-3 px-4">{tx.customerName}</td>
                  <td className="py-3 px-4 text-center uppercase text-xs font-semibold">{tx.paymentMethod}</td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">{formatRupiah(parseFloat(tx.totalAmount))}</td>
                </tr>
              ))}
            </tbody></table>
          </CardContent></Card>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border/50"><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-1"><Banknote className="w-4 h-4" /> Cash</p><p className="text-2xl font-bold mt-1 text-emerald-400">{formatRupiah(finData.summary?.totalCash || 0)}</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-1"><Smartphone className="w-4 h-4" /> QRIS</p><p className="text-2xl font-bold mt-1 text-blue-400">{formatRupiah(finData.summary?.totalQris || 0)}</p></CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-6"><p className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Total Revenue</p><p className="text-2xl font-bold mt-1 text-primary">{formatRupiah(finData.summary?.totalRevenue || 0)}</p></CardContent></Card>
          </div>
          <Card className="border-border/50"><CardContent className="p-0">
            <table className="w-full text-sm"><thead><tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left py-3 px-4 font-medium">Tanggal</th><th className="text-right py-3 px-4 font-medium">Cash</th><th className="text-right py-3 px-4 font-medium">QRIS</th><th className="text-right py-3 px-4 font-medium">Total</th>
            </tr></thead><tbody>
              {(finData.transactions || []).map((tx: any) => (
                <tr key={tx.id} className="border-b border-border/30 hover:bg-accent/30">
                  <td className="py-3 px-4">{new Date(tx.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="py-3 px-4 text-right">{tx.paymentMethod === "cash" ? formatRupiah(parseFloat(tx.totalAmount)) : "—"}</td>
                  <td className="py-3 px-4 text-right">{tx.paymentMethod === "qris" ? formatRupiah(parseFloat(tx.totalAmount)) : "—"}</td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">{formatRupiah(parseFloat(tx.totalAmount))}</td>
                </tr>
              ))}
            </tbody></table>
          </CardContent></Card>
        </>
      )}
    </div>
  );
}
