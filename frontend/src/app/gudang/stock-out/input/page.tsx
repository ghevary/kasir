"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MenuItem } from "@/types";
import { Upload } from "lucide-react";

export default function GudangStockOutInputPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState({ menuItemId: "", qty: "", notes: "", notaNumber: "" });
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setMenuItems(await api.getMenuItems().catch(() => []));
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.menuItemId || !form.qty) {
      return toast.error("Item dan jumlah wajib diisi");
    }
    try {
      // Use stock out via the stock API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/stock/out`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": JSON.parse(localStorage.getItem("user") || "{}").id || "",
          },
          body: JSON.stringify({
            menuItemId: form.menuItemId,
            qty: parseInt(form.qty),
            notes: form.notes,
            notaNumber: form.notaNumber || `NBO-${Date.now()}`,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Barang keluar berhasil dicatat!");
      setForm({ menuItemId: "", qty: "", notes: "", notaNumber: "" });
      setSelectedItem(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Upload className="w-6 h-6" /> Input Barang Keluar</h1>
        <p className="text-muted-foreground mt-1">Catat barang keluar dari gudang</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Item Menu</label>
            <select
              value={form.menuItemId}
              onChange={(e) => {
                setForm({ ...form, menuItemId: e.target.value });
                setSelectedItem(menuItems.find((i) => i.id === e.target.value) || null);
              }}
              className="w-full h-11 px-3 rounded-lg bg-background/50 border border-border/50 text-sm"
            >
              <option value="">-- Pilih Item --</option>
              {menuItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Stok: {i.stockQty})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah Keluar *</label>
              <Input
                type="number"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Nota</label>
              <Input
                value={form.notaNumber}
                onChange={(e) => setForm({ ...form, notaNumber: e.target.value })}
                placeholder="Auto-generate"
                className="bg-background/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan</label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Alasan barang keluar..."
              className="bg-background/50"
            />
          </div>
          {selectedItem && form.qty && (
            <div className="p-3 rounded-lg bg-accent/30 text-sm">
              Stok saat ini: <b>{selectedItem.stockQty}</b> → Setelah keluar:{" "}
              <b className="text-red-400">
                {Math.max(selectedItem.stockQty - parseInt(form.qty || "0"), 0)}
              </b>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setForm({ menuItemId: "", qty: "", notes: "", notaNumber: "" });
                setSelectedItem(null);
              }}
              className="flex-1 cursor-pointer"
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-primary cursor-pointer">
              <Upload className="w-4 h-4 mr-2" /> Simpan Barang Keluar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
