"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Shift } from "@/types";
import { Unlock, Lock, BarChart, CheckCircle, AlertTriangle } from "lucide-react";

export default function KasirShiftPage() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [physicalCash, setPhysicalCash] = useState("");
  const [notes, setNotes] = useState("");
  const [shiftSummary, setShiftSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShift();
  }, []);

  const loadShift = async () => {
    try {
      const shift = await api.getActiveShift().catch(() => null);
      setActiveShift(shift);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    try {
      const shift = await api.openShift();
      setActiveShift(shift);
      toast.success("Shift dibuka!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCloseShift = async () => {
    try {
      const result = await api.closeShift({ physicalCash, notes });
      setShiftSummary(result.summary);
      setActiveShift(null);
      toast.success("Shift ditutup!");
    } catch (err: any) {
      toast.error(err.message);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Shift</h1>
        <p className="text-muted-foreground mt-1">Buka atau tutup shift kerja</p>
      </div>

      {!activeShift && !shiftSummary && (
        <Card className="border-border/50 text-center">
          <CardContent className="p-10 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary">
              <Unlock className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tidak Ada Shift Aktif</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Buka shift baru untuk memulai transaksi hari ini
              </p>
            </div>
            <Button
              onClick={handleOpenShift}
              className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 cursor-pointer"
            >
              <Unlock className="w-5 h-5 mr-2 inline" /> Buka Shift
            </Button>
          </CardContent>
        </Card>
      )}

      {activeShift && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Lock className="w-5 h-5" /> Akhiri Shift</CardTitle>
            <p className="text-sm text-muted-foreground">
              Shift #{activeShift.id.slice(0, 8)} | Mulai:{" "}
              {new Date(activeShift.startedAt).toLocaleTimeString("id-ID")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah Cash Fisik</label>
              <Input
                type="number"
                placeholder="Rp ..."
                value={physicalCash}
                onChange={(e) => setPhysicalCash(e.target.value)}
                className="h-11 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <Input
                placeholder="Catatan shift..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-11 bg-background/50"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 cursor-pointer">
                Batal
              </Button>
              <Button
                onClick={handleCloseShift}
                className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 cursor-pointer"
              >
                <Lock className="w-4 h-4 mr-2" /> Konfirmasi Tutup Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {shiftSummary && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart className="w-5 h-5" /> Ringkasan Shift</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-accent/30">
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-xl font-bold">{shiftSummary.totalTransactions}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent/30">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-primary">
                  {formatRupiah(shiftSummary.totalRevenue)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/30">
                <p className="text-sm text-muted-foreground">Cash (Sistem)</p>
                <p className="text-lg font-semibold">{formatRupiah(shiftSummary.totalCash)}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent/30">
                <p className="text-sm text-muted-foreground">QRIS</p>
                <p className="text-lg font-semibold">{formatRupiah(shiftSummary.totalQris)}</p>
              </div>
            </div>
            {shiftSummary.difference !== undefined && (
              <div className={`p-4 rounded-lg ${shiftSummary.difference === 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                <p className="text-sm text-muted-foreground">Selisih Cash</p>
                <p className={`text-lg font-bold ${shiftSummary.difference === 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatRupiah(shiftSummary.difference)} {shiftSummary.difference === 0 ? <CheckCircle className="w-4 h-4 inline ml-1" /> : <AlertTriangle className="w-4 h-4 inline ml-1" />}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
