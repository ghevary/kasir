"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Clock, CheckCircle, XCircle, Package, Inbox, Activity } from "lucide-react";

export default function GudangRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setRequests(await api.getStockRequests());
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1 inline" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle className="w-3 h-3 mr-1 inline" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1 inline" /> Rejected</Badge>;
      case "fulfilled":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Package className="w-3 h-3 mr-1 inline" /> Fulfilled</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Inbox className="w-6 h-6" /> Daftar Request</h1>
          <p className="text-muted-foreground mt-1">Semua request dari kasir</p>
        </div>
        <Badge variant="outline" className="animate-pulse flex items-center gap-1"><Activity className="w-3 h-3 text-red-500" /> Live</Badge>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Item</th>
                <th className="text-center py-3 px-4 font-medium">Req Qty</th>
                <th className="text-center py-3 px-4 font-medium">Approved</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada request
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{req.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">{req.menuItemId.slice(0, 8)}...</td>
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
