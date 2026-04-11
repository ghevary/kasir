"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MenuItem } from "@/types";
import { Clock, CheckCircle, XCircle, Package, Send, Plus, Trash2 } from "lucide-react";

interface RequestItem {
  menuItemId: string;
  requestedQty: string;
  notes: string;
}

export default function KasirRequestPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [items, setItems] = useState<RequestItem[]>([
    { menuItemId: "", requestedQty: "", notes: "" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [menuData, reqData] = await Promise.all([
        api.getActiveMenuItems().catch(() => []),
        api.getStockRequests().catch(() => []),
      ]);
      setMenuItems(menuData);
      setRequests(reqData);
    } catch {} finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setItems([...items, { menuItemId: "", requestedQty: "", notes: "" }]);
  };

  const removeRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof RequestItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.menuItemId && i.requestedQty);
    if (validItems.length === 0) {
      return toast.error("Minimal 1 item dengan jumlah harus diisi");
    }

    try {
      await api.createStockRequest(
        validItems.map((i) => ({
          menuItemId: i.menuItemId,
          requestedQty: parseInt(i.requestedQty),
          notes: i.notes,
        }))
      );
      toast.success(`${validItems.length} item request berhasil dikirim!`);
      setItems([{ menuItemId: "", requestedQty: "", notes: "" }]);
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
        <p className="text-muted-foreground mt-1">Kirim permintaan bahan ke gudang (bisa multi-item sekaligus)</p>
      </div>

      {/* Multi-item Form */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Buat Request Baru (Multi-Item)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50">
                <th className="text-left py-2 px-2 font-medium">Item Menu</th>
                <th className="text-left py-2 px-2 font-medium w-24">Stok Outlet</th>
                <th className="text-left py-2 px-2 font-medium w-28">Jumlah</th>
                <th className="text-left py-2 px-2 font-medium">Catatan</th>
                <th className="text-center py-2 px-2 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const selectedItem = menuItems.find((m) => m.id === item.menuItemId);
                return (
                  <tr key={index} className="border-b border-border/30">
                    <td className="py-2 px-2">
                      <select
                        value={item.menuItemId}
                        onChange={(e) => updateRow(index, "menuItemId", e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-background/50 border border-border/50 text-sm"
                      >
                        <option value="">-- Pilih Item --</option>
                        {menuItems.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`font-medium ${(selectedItem?.outletQty || 0) <= (selectedItem?.stockAlertThreshold || 5) ? "text-red-400" : "text-emerald-400"}`}>
                        {selectedItem ? (selectedItem.outletQty || 0) : "—"}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        value={item.requestedQty}
                        onChange={(e) => updateRow(index, "requestedQty", e.target.value)}
                        placeholder="0"
                        className="bg-background/50 h-10"
                        min={1}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        value={item.notes}
                        onChange={(e) => updateRow(index, "notes", e.target.value)}
                        placeholder="Opsional..."
                        className="bg-background/50 h-10"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(index)}
                        disabled={items.length === 1}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={addRow} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> Tambah Baris
            </Button>
            <Button onClick={handleSubmit} className="bg-primary cursor-pointer">
              <Send className="w-4 h-4 mr-2" /> Kirim Request ({items.filter((i) => i.menuItemId && i.requestedQty).length} item)
            </Button>
          </div>
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
