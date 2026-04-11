"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Users, Plus, Edit, Trash2, X } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "kasir" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || (!editingUser && !form.password)) {
      return toast.error("Nama, email, dan password wajib diisi");
    }
    try {
      if (editingUser) {
        const updateData: any = { name: form.name, email: form.email, role: form.role };
        if (form.password) updateData.password = form.password;
        await api.updateUser(editingUser.id, updateData);
        toast.success("Pengguna berhasil diperbarui!");
      } else {
        await api.createUser(form);
        toast.success("Pengguna berhasil ditambahkan!");
      }
      setForm({ name: "", email: "", password: "", role: "kasir" });
      setShowForm(false);
      setEditingUser(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (user: UserItem) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setShowForm(true);
  };

  const handleDelete = async (user: UserItem) => {
    if (!confirm(`Nonaktifkan pengguna "${user.name}"?`)) return;
    try {
      await api.deleteUser(user.id);
      toast.success("Pengguna berhasil dinonaktifkan!");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    try {
      await api.updateUser(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    kasir: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    gudang: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6" /> Kelola Pengguna
          </h1>
          <p className="text-muted-foreground mt-1">Tambah, edit, dan kelola akun pengguna</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null);
            setForm({ name: "", email: "", password: "", role: "kasir" });
            setShowForm(!showForm);
          }}
          className="bg-primary cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? "Tutup" : "Tambah Pengguna"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-border/50 animate-slide-in-left">
          <CardHeader>
            <CardTitle className="text-lg">{editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama lengkap"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@contoh.com"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Password {editingUser && <span className="text-muted-foreground">(kosongkan jika tidak diubah)</span>}
                </label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg bg-background/50 border border-border/50 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="kasir">Kasir</option>
                  <option value="gudang">Gudang</option>
                </select>
              </div>
            </div>
            <Button onClick={handleSubmit} className="bg-primary cursor-pointer">
              {editingUser ? "Simpan Perubahan" : "Tambah Pengguna"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Daftar Pengguna ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Nama</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-center py-3 px-4 font-medium">Role</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-center py-3 px-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={roleColors[user.role]}>{user.role}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      className={`cursor-pointer ${user.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
