"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MenuItem } from "@/types";
import { Clock, CheckCircle, XCircle, Package, Send } from "lucide-react";

export default function KasirRequestPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ menuItemId: "", requestedQty: "", notes: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [items, reqs] = await Promise.all([
        api.getActiveMenuItems().catch(() => []),
        api.getStockRequests().catch(() => []),
      ]);
      setMenuItems(items);
      setRequests(reqs);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.menuItemId || !form.requestedQty) {
      return toast.error("Item dan jumlah wajib diisi");
    }
    try {
      await api.createStockRequest([
        {
          menuItemId: form.menuItemId,
          requestedQty: parseInt(form.requestedQty),
          notes: form.notes,
        },
      ]);
      toast.success("Request bahan berhasil dikirim!");
      setForm({ menuItemId: "", requestedQty: "", notes: "" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1 inline" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle className="w-3 h-3 mr-1 inline" /> Disetujui</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1 inline" /> Ditolak</Badge>;
      case "fulfilled":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Package className="w-3 h-3 mr-1 inline" /> Dikirim</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Package className="w-6 h-6" /> Request Bahan</h1>
        <p className="text-muted-foreground mt-1">Kirim permintaan bahan ke gudang</p>
      </div>

      {/* Form */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Buat Request Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Menu</label>
              <select
                value={form.menuItemId}
                onChange={(e) => setForm({ ...form, menuItemId: e.target.value })}
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                value={form.requestedQty}
                onChange={(e) => setForm({ ...form, requestedQty: e.target.value })}
                placeholder="0"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Opsional..."
                className="bg-background/50"
              />
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            className="bg-primary cursor-pointer"
          >
            <Send className="w-4 h-4 mr-2" /> Kirim Request
          </Button>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Request Saya</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                <th className="text-left py-3 px-4 font-medium">Item</th>
                <th className="text-center py-3 px-4 font-medium">Qty</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada request
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const item = menuItems.find((m) => m.id === req.menuItemId);
                  return (
                    <tr key={req.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-4 font-medium">{item?.name || req.menuItemId.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-center">{req.requestedQty}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(req.status)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{req.notes || "—"}</td>
                    </tr>
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
