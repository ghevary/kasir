"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Transaction } from "@/types";
import { Wallet, Banknote, Smartphone, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface FinancialReport {
  transactions: Transaction[];
  summary: {
    totalCash: number;
    totalQris: number;
    totalRevenue: number;
    totalTransactions: number;
  };
}

export default function KasirHistoryFinancialPage() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getFinancialReport();
        setReport(data);
      } catch (err: any) {
        toast.error(err.message || "Gagal memuat laporan keuangan");
      } finally {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Wallet className="w-6 h-6" /> Laporan Keuangan</h1>
        <p className="text-muted-foreground mt-1">Ringkasan pendapatan dari semua transaksi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {formatRupiah(report.summary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dari {report.summary.totalTransactions} transaksi</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pembayaran Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              {formatRupiah(report.summary.totalCash)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pembayaran QRIS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              {formatRupiah(report.summary.totalQris)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 mt-6">
        <CardHeader>
           <CardTitle>Rincian Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Waktu</th>
                <th className="text-left py-3 px-4 font-medium">ID Transaksi</th>
                <th className="text-left py-3 px-4 font-medium">Metode</th>
                <th className="text-right py-3 px-4 font-medium">Jumlah Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {report.transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi
                  </td>
                </tr>
              ) : (
                report.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{tx.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          tx.paymentMethod === "cash"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }
                      >
                        {tx.paymentMethod === "cash" ? <><Banknote className="w-3 h-3 mr-1 inline" /> Cash</> : <><Smartphone className="w-3 h-3 mr-1 inline" /> QRIS</>}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">
                      {formatRupiah(parseFloat(tx.totalAmount))}
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
