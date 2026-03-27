"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users as UsersIcon, ShoppingCart, Package, Shield } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "kasir" });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      // Fetch users — will need a backend endpoint
      const res = await fetch(`${API_URL}/api/auth/users`, {
        headers: {
          "x-user-id": JSON.parse(localStorage.getItem("user") || "{}").id || "",
        },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      return toast.error("Semua field wajib diisi");
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("User berhasil ditambahkan!");
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "kasir" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Shield className="w-3 h-3 mr-1 inline" /> Admin</Badge>;
      case "kasir":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><ShoppingCart className="w-3 h-3 mr-1 inline" /> Kasir</Badge>;
      case "gudang":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30"><Package className="w-3 h-3 mr-1 inline" /> Gudang</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><UsersIcon className="w-6 h-6" /> Manajemen User</h1>
          <p className="text-muted-foreground mt-1">Kelola akses pengguna sistem</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-primary cursor-pointer">
          {showForm ? "Batal" : "+ Tambah User"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Tambah User Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nama Lengkap"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@email.com"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 karakter"
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
                  <option value="kasir">Kasir</option>
                  <option value="gudang">Gudang</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full bg-primary cursor-pointer">
              💾 Simpan User
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Nama</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-center py-3 px-4 font-medium">Role</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada user
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4 text-center">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={user.isActive !== false ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                        {user.isActive !== false ? "Aktif" : "Nonaktif"}
                      </Badge>
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
