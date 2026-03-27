"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setCategories(await api.getCategories()); } catch {} finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newName) return toast.error("Nama kategori harus diisi");
    try {
      await api.createCategory({ name: newName, description: newDesc });
      toast.success("Kategori ditambahkan!");
      setNewName(""); setNewDesc(""); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try { await api.deleteCategory(id); toast.info("Kategori dinonaktifkan"); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Kelola Kategori</h1>
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-lg">Tambah Kategori</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Input placeholder="Nama Kategori" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 bg-background/50" />
          <Input placeholder="Deskripsi (opsional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="flex-1 bg-background/50" />
          <Button onClick={handleCreate} className="bg-primary cursor-pointer">+ Tambah</Button>
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
                    {cat.isActive && <Button size="sm" variant="outline" onClick={() => handleDelete(cat.id)} className="text-xs text-destructive cursor-pointer">Hapus</Button>}
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
