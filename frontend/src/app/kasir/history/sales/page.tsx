"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Transaction } from "@/types";
import { FileText, Banknote, Smartphone, CheckCircle, XCircle, Clock } from "lucide-react";

export default function KasirHistorySalesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setTransactions(await api.getTransactions());
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FileText className="w-6 h-6" /> Riwayat Penjualan</h1>
        <p className="text-muted-foreground mt-1">Semua transaksi yang telah dilakukan</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Waktu</th>
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Pelanggan</th>
                <th className="text-center py-3 px-4 font-medium">Metode</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
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
                    <td className="py-3 px-4">{tx.customerName}</td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-center">
                      <Badge
                        className={
                          tx.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : tx.status === "cancelled"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }
                      >
                        {tx.status === "completed"
                          ? <><CheckCircle className="w-3 h-3 mr-1 inline" /> Selesai</>
                          : tx.status === "cancelled"
                          ? <><XCircle className="w-3 h-3 mr-1 inline" /> Batal</>
                          : <><Clock className="w-3 h-3 mr-1 inline" /> Pending</>}
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
