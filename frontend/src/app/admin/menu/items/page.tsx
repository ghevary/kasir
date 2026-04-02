"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MenuItem } from "@/types";
import { Pencil, Trash2, Plus, Save, X, Utensils } from "lucide-react";

export default function AdminMenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", categoryId: "", price: "", stockQty: "0", description: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [i, c] = await Promise.all([api.getMenuItems(), api.getCategories()]);
      setItems(i); setCategories(c);
    } catch {} finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: "", categoryId: "", price: "", stockQty: "0", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.price) return toast.error("Nama dan harga wajib diisi");
    try {
      await api.createMenuItem({
        ...form, price: form.price, stockQty: parseInt(form.stockQty),
      });
      toast.success("Menu ditambahkan!");
      resetForm(); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      categoryId: item.categoryId || "",
      price: String(item.price),
      stockQty: String(item.stockQty),
      description: item.description || "",
    });
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !form.name || !form.price) return toast.error("Nama dan harga wajib diisi");
    try {
      await api.updateMenuItem(editingId, {
        ...form, price: form.price, stockQty: parseInt(form.stockQty),
      });
      toast.success("Menu diperbarui!");
      resetForm(); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMenuItem(id);
      toast.info("Menu dinonaktifkan");
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Utensils className="w-6 h-6" /> Menu Items</h1>
        <Button onClick={() => { if (showForm && !editingId) { resetForm(); } else { resetForm(); setShowForm(true); } }} className="bg-primary cursor-pointer gap-1">
          {showForm && !editingId ? <><X className="w-4 h-4" /> Batal</> : <><Plus className="w-4 h-4" /> Tambah Menu</>}
        </Button>
      </div>

      {showForm && (
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Menu" : "Tambah Menu Baru"}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Input placeholder="Nama Menu *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-background/50" />
            <select value={form.categoryId} onChange={(e) => setForm({...form, categoryId: e.target.value})} className="h-10 px-3 rounded-lg bg-background/50 border border-border/50 text-sm">
              <option value="">Pilih Kategori</option>
              {categories.filter(c => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Harga *" type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="bg-background/50" />
            <Input placeholder="Stok" type="number" value={form.stockQty} onChange={(e) => setForm({...form, stockQty: e.target.value})} className="bg-background/50" />
            <Input placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="col-span-2 bg-background/50" />
            <div className="col-span-2 flex gap-3">
              {editingId ? (
                <>
                  <Button onClick={handleUpdate} className="flex-1 bg-primary cursor-pointer gap-1"><Save className="w-4 h-4" /> Simpan Perubahan</Button>
                  <Button variant="outline" onClick={resetForm} className="cursor-pointer gap-1"><X className="w-4 h-4" /> Batal</Button>
                </>
              ) : (
                <Button onClick={handleCreate} className="w-full bg-primary cursor-pointer gap-1"><Save className="w-4 h-4" /> Simpan Menu</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left py-3 px-4 font-medium">Nama</th>
              <th className="text-left py-3 px-4 font-medium">Kategori</th>
              <th className="text-right py-3 px-4 font-medium">Harga</th>
              <th className="text-center py-3 px-4 font-medium">Stok</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-accent/30">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{categories.find((c) => c.id === item.categoryId)?.name || "—"}</td>
                  <td className="py-3 px-4 text-right text-primary font-semibold">{formatRupiah(parseFloat(item.price))}</td>
                  <td className="py-3 px-4 text-center">{item.stockQty}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={item.isAvailable ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                      {item.isAvailable ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {item.isAvailable && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="text-xs cursor-pointer gap-1">
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)} className="text-xs text-destructive cursor-pointer gap-1">
                            <Trash2 className="w-3 h-3" /> Hapus
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
