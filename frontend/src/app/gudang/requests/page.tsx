"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MenuItem } from "@/types";
import { Clock, CheckCircle, XCircle, Package, Inbox, Activity, Warehouse } from "lucide-react";

export default function GudangRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [reqs, items] = await Promise.all([
          api.getStockRequests(),
          api.getStockMonitor().catch(() => []),
        ]);
        setRequests(reqs);
        setMenuItems(items);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (req: any) => {
    setProcessingId(req.id);
    try {
      await api.approveRequest(req.id, req.requestedQty);
      toast.success("Request disetujui! Stok dipindahkan ke outlet.");
      // Reload data
      const [reqs, items] = await Promise.all([
        api.getStockRequests(),
        api.getStockMonitor().catch(() => []),
      ]);
      setRequests(reqs);
      setMenuItems(items);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: any) => {
    const notes = prompt("Alasan penolakan (opsional):");
    setProcessingId(req.id);
    try {
      await api.rejectRequest(req.id, notes || "");
      toast.success("Request ditolak.");
      const reqs = await api.getStockRequests();
      setRequests(reqs);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
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

  const getItemName = (menuItemId: string) => {
    const item = menuItems.find((m) => m.id === menuItemId);
    return item?.name || menuItemId.slice(0, 8);
  };

  const getWarehouseStock = (menuItemId: string) => {
    const item = menuItems.find((m) => m.id === menuItemId);
    return item?.warehouseQty || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Inbox className="w-6 h-6" /> Daftar Request</h1>
          <p className="text-muted-foreground mt-1">Approve request = stok gudang↓ stok outlet↑</p>
        </div>
        <Badge variant="outline" className="animate-pulse flex items-center gap-1"><Activity className="w-3 h-3 text-red-500" /> Live</Badge>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Menunggu Persetujuan ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium">Item</th>
                  <th className="text-center py-3 px-4 font-medium">Req Qty</th>
                  <th className="text-center py-3 px-4 font-medium">Stok Gudang</th>
                  <th className="text-left py-3 px-4 font-medium">Catatan</th>
                  <th className="text-center py-3 px-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => {
                  const warehouseStock = getWarehouseStock(req.menuItemId);
                  const isInsufficient = warehouseStock < req.requestedQty;

                  return (
                    <tr key={req.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 px-4 font-medium">{getItemName(req.menuItemId)}</td>
                      <td className="py-3 px-4 text-center font-semibold">{req.requestedQty}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${isInsufficient ? "text-red-400" : "text-blue-400"}`}>
                          {warehouseStock}
                        </span>
                        {isInsufficient && (
                          <p className="text-xs text-red-400">Kurang!</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{req.notes || "—"}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(req)}
                            disabled={processingId === req.id || isInsufficient}
                            className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(req)}
                            disabled={processingId === req.id}
                            className="cursor-pointer"
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Request</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                <th className="text-left py-3 px-4 font-medium">Item</th>
                <th className="text-center py-3 px-4 font-medium">Req Qty</th>
                <th className="text-center py-3 px-4 font-medium">Approved</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {processedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat
                  </td>
                </tr>
              ) : (
                processedRequests.map((req) => (
                  <tr key={req.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-medium">{getItemName(req.menuItemId)}</td>
                    <td className="py-3 px-4 text-center">{req.requestedQty}</td>
                    <td className="py-3 px-4 text-center">{req.approvedQty || "—"}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(req.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{req.notes || "—"}</td>
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
