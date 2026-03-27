"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { StockRequest } from "@/types";
import { Clock, CheckCircle, XCircle, Package, Inbox, ClipboardList } from "lucide-react";

export default function GudangDashboard() {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getStockRequests().catch(() => []);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const fulfilledToday = requests.filter((r) => r.status === "fulfilled");

  const handleApprove = async (id: string, qty: number) => {
    try {
      await api.approveRequest(id, qty);
      toast.success("Request disetujui!");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectRequest(id, "Ditolak oleh gudang");
      toast.info("Request ditolak");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFulfill = async (id: string) => {
    try {
      await api.fulfillRequest(id);
      toast.success("Request dipenuhi! Nota dibuat.");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Gudang</h1>
        <p className="text-muted-foreground mt-1">
          Kelola request dan barang keluar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Request Pending", value: pendingRequests.length, icon: <Inbox className="w-6 h-6 text-yellow-500" />, color: "from-yellow-500/20 to-yellow-500/5" },
          { title: "Fulfilled Hari Ini", value: fulfilledToday.length, icon: <CheckCircle className="w-6 h-6 text-emerald-500" />, color: "from-emerald-500/20 to-emerald-500/5" },
          { title: "Total Request", value: requests.length, icon: <ClipboardList className="w-6 h-6 text-blue-500" />, color: "from-blue-500/20 to-blue-500/5" },
        ].map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Request List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Request Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Item</th>
                  <th className="text-center py-3 px-4 font-medium">Qty</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-center py-3 px-4 font-medium">Aksi</th>
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
                  requests.map((req) => (
                    <tr key={req.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{req.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">{req.menuItemId.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-center">{req.requestedQty}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(req.status)}</td>
                      <td className="py-3 px-4 text-center">
                        {req.status === "pending" && (
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(req.id, req.requestedQty)}
                              className="text-xs cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4 mr-1 inline" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(req.id)}
                              className="text-xs text-destructive cursor-pointer"
                            >
                              <XCircle className="w-4 h-4 mr-1 inline" /> Reject
                            </Button>
                          </div>
                        )}
                        {req.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => handleFulfill(req.id)}
                            className="text-xs bg-primary cursor-pointer"
                          >
                            <Package className="w-4 h-4 mr-1 inline" /> Fulfill
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
