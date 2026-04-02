"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Save, X, Tags } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setCategories(await api.getCategories()); } catch {} finally { setLoading(false); }
  };

  const resetForm = () => {
    setNewName(""); setNewDesc(""); setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newName) return toast.error("Nama kategori harus diisi");
    try {
      await api.createCategory({ name: newName, description: newDesc });
      toast.success("Kategori ditambahkan!");
      resetForm(); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewDesc(cat.description || "");
  };

  const handleUpdate = async () => {
    if (!editingId || !newName) return toast.error("Nama kategori harus diisi");
    try {
      await api.updateCategory(editingId, { name: newName, description: newDesc });
      toast.success("Kategori diperbarui!");
      resetForm(); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try { await api.deleteCategory(id); toast.info("Kategori dinonaktifkan"); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Tags className="w-6 h-6" /> Kelola Kategori</h1>
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Kategori" : "Tambah Kategori"}</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Input placeholder="Nama Kategori" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 bg-background/50" />
          <Input placeholder="Deskripsi (opsional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="flex-1 bg-background/50" />
          {editingId ? (
            <>
              <Button onClick={handleUpdate} className="bg-primary cursor-pointer gap-1"><Save className="w-4 h-4" /> Simpan</Button>
              <Button variant="outline" onClick={resetForm} className="cursor-pointer gap-1"><X className="w-4 h-4" /> Batal</Button>
            </>
          ) : (
            <Button onClick={handleCreate} className="bg-primary cursor-pointer gap-1"><Plus className="w-4 h-4" /> Tambah</Button>
          )}
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left py-3 px-4 font-medium">Nama</th>
              <th className="text-left py-3 px-4 font-medium">Deskripsi</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Aksi</th>
            </tr></thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border/30 hover:bg-accent/30">
                  <td className="py-3 px-4 font-medium">{cat.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{cat.description || "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={cat.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                      {cat.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {cat.isActive && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(cat)} className="text-xs cursor-pointer gap-1">
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(cat.id)} className="text-xs text-destructive cursor-pointer gap-1">
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
