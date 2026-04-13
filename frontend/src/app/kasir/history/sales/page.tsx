"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Transaction, TransactionItem } from "@/types";
import {
  FileText,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  QrCode,
} from "lucide-react";

interface TransactionWithItems extends Transaction {
  items?: TransactionItem[];
}

export default function KasirHistorySalesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [txItems, setTxItems] = useState<Record<string, TransactionItem[]>>({});

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

  const handleExpand = async (txId: string) => {
    if (expandedTx === txId) {
      setExpandedTx(null);
      return;
    }

    setExpandedTx(txId);

    // Load items if not already loaded
    if (!txItems[txId]) {
      setLoadingItems(txId);
      try {
        const receipt = await api.getReceipt(txId);
        setTxItems((prev) => ({
          ...prev,
          [txId]: receipt.receipt.items || [],
        }));
      } catch {
        setTxItems((prev) => ({
          ...prev,
          [txId]: [],
        }));
      } finally {
        setLoadingItems(null);
      }
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6" /> Riwayat Penjualan
        </h1>
        <p className="text-muted-foreground mt-1">
          Semua transaksi yang telah dilakukan — klik baris untuk melihat detail barang
        </p>
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
                <th className="text-center py-3 px-4 font-medium w-12">Detail</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isExpanded = expandedTx === tx.id;
                  const items = txItems[tx.id];
                  const isLoading = loadingItems === tx.id;

                  return (
                    <>
                      <tr
                        key={tx.id}
                        className={`border-b border-border/30 hover:bg-accent/30 transition-colors cursor-pointer ${
                          isExpanded ? "bg-accent/20" : ""
                        }`}
                        onClick={() => handleExpand(tx.id)}
                      >
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
                            {tx.status === "completed" ? (
                              <><CheckCircle className="w-3 h-3 mr-1 inline" /> Selesai</>
                            ) : tx.status === "cancelled" ? (
                              <><XCircle className="w-3 h-3 mr-1 inline" /> Batal</>
                            ) : (
                              <><Clock className="w-3 h-3 mr-1 inline" /> Pending</>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {formatRupiah(parseFloat(tx.totalAmount))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="sm" className="cursor-pointer">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${tx.id}-detail`}>
                          <td colSpan={7} className="p-0">
                            <div className="bg-accent/20 border-b border-border/30 px-6 py-4 animate-in slide-in-from-top-2">
                              {isLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="animate-spin h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full" />
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    Memuat detail barang...
                                  </span>
                                </div>
                              ) : items && items.length > 0 ? (
                                <div>
                                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Detail Barang ({items.length} item)
                                  </p>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-muted-foreground border-b border-border/30">
                                        <th className="text-left py-2 px-3 font-medium">
                                          Nama Barang
                                        </th>
                                        <th className="text-center py-2 px-3 font-medium">
                                          Qty
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium">
                                          Harga Satuan
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium">
                                          Subtotal
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {items.map((item: any) => (
                                        <tr
                                          key={item.id}
                                          className="border-b border-border/20 hover:bg-accent/20"
                                        >
                                          <td className="py-2 px-3 font-medium">
                                            {item.menuItemName || "Item dihapus"}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            {item.qty}×
                                          </td>
                                          <td className="py-2 px-3 text-right text-muted-foreground">
                                            {formatRupiah(parseFloat(item.unitPrice))}
                                          </td>
                                          <td className="py-2 px-3 text-right font-semibold text-primary">
                                            {formatRupiah(parseFloat(item.subtotal))}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t border-border/50">
                                        <td
                                          colSpan={3}
                                          className="py-2 px-3 text-right font-semibold"
                                        >
                                          Total
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-primary">
                                          {formatRupiah(parseFloat(tx.totalAmount))}
                                        </td>
                                      </tr>
                                      {tx.paymentMethod === "cash" && (
                                        <>
                                          <tr>
                                            <td
                                              colSpan={3}
                                              className="py-1 px-3 text-right text-muted-foreground text-xs"
                                            >
                                              Dibayar
                                            </td>
                                            <td className="py-1 px-3 text-right text-muted-foreground text-xs">
                                              {formatRupiah(parseFloat(tx.paidAmount))}
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              colSpan={3}
                                              className="py-1 px-3 text-right text-muted-foreground text-xs"
                                            >
                                              Kembalian
                                            </td>
                                            <td className="py-1 px-3 text-right text-muted-foreground text-xs">
                                              {formatRupiah(parseFloat(tx.changeAmount))}
                                            </td>
                                          </tr>
                                        </>
                                      )}
                                    </tfoot>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-3">
                                  Tidak ada data item untuk transaksi ini
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
