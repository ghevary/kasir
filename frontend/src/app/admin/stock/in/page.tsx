"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { MenuItem } from "@/types";

export default function AdminStockInPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState({ menuItemId: "", qty: "", supplier: "", purchasePrice: "", notes: "" });
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setItems(await api.getMenuItems()); } catch {} finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.menuItemId || !form.qty) return toast.error("Item dan jumlah wajib diisi");
    try {
      await api.createStockIn({
        menuItemId: form.menuItemId,
        qty: parseInt(form.qty),
        supplier: form.supplier,
        purchasePrice: form.purchasePrice,
        notes: form.notes,
      });
      toast.success("Barang masuk berhasil dicatat!");
      setForm({ menuItemId: "", qty: "", supplier: "", purchasePrice: "", notes: "" });
      setSelectedItem(null); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Package className="w-6 h-6" /> Input Barang Masuk</h1>
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Item Menu</label>
            <select
              value={form.menuItemId}
              onChange={(e) => {
                setForm({ ...form, menuItemId: e.target.value });
                setSelectedItem(items.find((i) => i.id === e.target.value) || null);
              }}
              className="w-full h-11 px-3 rounded-lg bg-background/50 border border-border/50 text-sm"
            >
              <option value="">-- Pilih Item --</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name} (Stok: {i.stockQty})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah Masuk *</label>
              <Input type="number" value={form.qty} onChange={(e) => setForm({...form, qty: e.target.value})} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Beli (opsional)</label>
              <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({...form, purchasePrice: e.target.value})} className="bg-background/50" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier (opsional)</label>
            <Input value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})} className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan</label>
            <Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="bg-background/50" />
          </div>
          {selectedItem && form.qty && (
            <div className="p-3 rounded-lg bg-accent/30 text-sm">
              Stok saat ini: <b>{selectedItem.stockQty}</b> → Setelah input: <b className="text-primary">{selectedItem.stockQty + parseInt(form.qty || "0")}</b>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setForm({ menuItemId: "", qty: "", supplier: "", purchasePrice: "", notes: "" }); setSelectedItem(null); }} className="flex-1 cursor-pointer">Batal</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-primary cursor-pointer">💾 Simpan Barang Masuk</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
