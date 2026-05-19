"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Transaction } from "@/types";
import {
  Wallet,
  Banknote,
  TrendingUp,
  QrCode,
  Search,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

interface FinancialReport {
  transactions: Transaction[];
  shifts?: { id: string; startedAt: string; endedAt: string | null; status: string }[];
  summary: {
    totalCash: number;
    totalQris?: number;
    totalRevenue: number;
    totalTransactions: number;
  };
}

export default function KasirHistoryFinancialPage() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const loadReport = async (date?: string) => {
    setLoading(true);
    try {
      const data = await api.getFinancialReport(date);
      setReport(data);
      setActiveDate(date || null);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat laporan keuangan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default: load today's shift financial data
    loadReport();
  }, []);

  const handleSearch = () => {
    if (searchDate) {
      loadReport(searchDate);
    }
  };

  const handleReset = () => {
    setSearchDate("");
    loadReport();
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (!report) return null;

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="w-6 h-6" /> Laporan Keuangan
        </h1>
        <p className="text-muted-foreground mt-1">
          Ringkasan pendapatan shift hari ini — gunakan pencarian tanggal untuk melihat riwayat
        </p>
      </div>

      {/* Date Search */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" /> Cari Berdasarkan Tanggal
              </label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-48 bg-background/50"
              />
            </div>
            <Button onClick={handleSearch} disabled={!searchDate} className="cursor-pointer">
              <Search className="w-4 h-4 mr-2" /> Cari
            </Button>
            {activeDate && (
              <Button onClick={handleReset} variant="outline" className="cursor-pointer">
                Tampilkan Hari Ini
              </Button>
            )}
          </div>
          <div className="mt-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <CalendarDays className="w-3 h-3 mr-1 inline" />
              {activeDate
                ? `Menampilkan shift tanggal: ${formatDisplayDate(activeDate)}`
                : `Menampilkan shift hari ini: ${todayStr}`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <QrCode className="w-5 h-5" />
              {formatRupiah(report.summary.totalQris || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Info */}
      {report.shifts && report.shifts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Info Shift</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-2 px-4 font-medium">Shift ID</th>
                  <th className="text-left py-2 px-4 font-medium">Buka</th>
                  <th className="text-left py-2 px-4 font-medium">Tutup</th>
                  <th className="text-center py-2 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.shifts.map((s) => (
                  <tr key={s.id} className="border-b border-border/30">
                    <td className="py-2 px-4 font-mono text-xs">{s.id.slice(0, 8)}</td>
                    <td className="py-2 px-4 text-muted-foreground">
                      {new Date(s.startedAt).toLocaleString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2 px-4 text-muted-foreground">
                      {s.endedAt
                        ? new Date(s.endedAt).toLocaleString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <Badge
                        className={
                          s.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-gray-500/20 text-gray-400"
                        }
                      >
                        {s.status === "active" ? "Aktif" : "Ditutup"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details */}
      <Card className="border-border/50">
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
                    {activeDate
                      ? `Tidak ada transaksi pada tanggal ${formatDisplayDate(activeDate)}`
                      : "Belum ada transaksi pada shift hari ini"}
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
                          tx.paymentMethod === "qris"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }
                      >
                        {tx.paymentMethod === "qris" ? (
                          <><QrCode className="w-3 h-3 mr-1 inline" /> QRIS</>
                        ) : (
                          <><Banknote className="w-3 h-3 mr-1 inline" /> Cash</>
                        )}
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
