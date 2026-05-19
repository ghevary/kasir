"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  TrendingUp,
  Package,
  Calculator,
  Printer,
  BarChart3,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

interface ShiftSale {
  shiftId: string;
  startedAt: string;
  endedAt: string;
  totalQty: number;
}

interface ForecastDetail {
  index: number;
  actual: number;
  forecast: number;
  error: number;
  absError: number;
  squaredError: number;
  percentError: number;
}

interface ForecastItem {
  menuItemId: string;
  menuItemName: string;
  outletQty: number;
  period: number;
  totalDataPoints: number;
  shiftSales: ShiftSale[];
  forecast: number | null;
  forecastRaw: number | null;
  mad: number;
  mse: number;
  mape: number;
  forecastDetails: ForecastDetail[];
  nextForecast: number | null;
  conclusion: string | null;
}

interface ForecastData {
  period: number;
  totalShifts: number;
  lookbackDays: number;
  items: ForecastItem[];
}

const WMA_PERIOD_OPTIONS = [3, 5, 7, 10];
const LOOKBACK_DAY_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

export default function KasirForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.getOutletForecast(period, lookbackDays);
      setData(result);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data peramalan");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  const itemsWithForecast = data?.items.filter((i) => i.forecast !== null) || [];
  const needsRequest = itemsWithForecast.filter(
    (i) => i.forecast !== null && i.forecast > (i.outletQty || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> Peramalan Stok Outlet
          </h1>
          <p className="text-muted-foreground mt-1">
            Prediksi kebutuhan stok outlet per-shift menggunakan Weighted Moving Average (WMA)
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="cursor-pointer print:hidden">
          <Printer className="w-4 h-4 mr-2" /> Cetak
        </Button>
      </div>

      {/* Parameter Card */}
      <Card className="border-border/50 print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Parameter Peramalan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode WMA</label>
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="flex h-9 w-40 rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                {WMA_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} shift (bobot 1-{opt})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Total bobot: {(period * (period + 1)) / 2}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Historis</label>
              <select
                value={lookbackDays}
                onChange={(e) => setLookbackDays(parseInt(e.target.value))}
                className="flex h-9 w-48 rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                {LOOKBACK_DAY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} hari terakhir
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Rentang shift yang dianalisis</p>
            </div>
            <Button onClick={load} className="bg-primary cursor-pointer">
              <BarChart3 className="w-4 h-4 mr-2" /> Hitung Peramalan
            </Button>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-accent/30 border border-border/50">
            <p className="text-xs text-muted-foreground">
              <strong>Keterangan:</strong> Peramalan ini menggunakan data per-shift (buka shift → tutup shift = 1 data point).
              <br />
              <strong>Rumus WMA:</strong> Ft = (W{period} × At-1 + W{period - 1} × At-2 + ... + W1 × At-{period}) / (W{period} + W{period - 1} + ... + W1)
              <br />
              <strong>Total Bobot:</strong> {period} + {period - 1} + ... + 1 = {(period * (period + 1)) / 2}
              <br />
              Data terbaru mendapat bobot terbesar, sehingga prediksi lebih responsif terhadap tren terkini.
              <br />
              <strong>MAD</strong> = Σ|Error| / n &nbsp; | &nbsp;
              <strong>MSE</strong> = Σ(Error²) / n &nbsp; | &nbsp;
              <strong>MAPE</strong> = (Σ(|Error|/Aktual × 100)) / n
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Periode WMA</p>
            <p className="text-2xl font-bold">{period} shift</p>
            <p className="text-xs text-muted-foreground mt-1">Bobot: 1 - {period}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-violet-500/10 to-violet-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Total Shift Dianalisis
            </p>
            <p className="text-2xl font-bold">{data?.totalShifts || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{lookbackDays} hari terakhir</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Item Dengan Prediksi</p>
            <p className="text-2xl font-bold">{itemsWithForecast.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-red-500/10 to-red-600/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Perlu Request
            </p>
            <p className="text-2xl font-bold text-red-400">{needsRequest.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" /> Hasil Peramalan Stok Outlet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Menu Item</th>
                <th className="text-center py-3 px-4 font-medium">Stok Outlet</th>
                <th className="text-center py-3 px-4 font-medium">Data (shift)</th>
                <th className="text-center py-3 px-4 font-medium">
                  Prediksi Shift Berikutnya
                </th>
                <th className="text-center py-3 px-4 font-medium">MAD</th>
                <th className="text-center py-3 px-4 font-medium">MSE</th>
                <th className="text-center py-3 px-4 font-medium">MAPE</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
                <th className="text-center py-3 px-4 font-medium print:hidden">Detail</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => {
                const needsStock =
                  item.forecast !== null && item.forecast > (item.outletQty || 0);
                const hasData = item.totalDataPoints > 0;
                const isExpanded = expandedItem === item.menuItemId;

                return (
                  <>
                    <tr
                      key={item.menuItemId}
                      className={`border-b border-border/30 hover:bg-accent/30 transition-colors ${
                        needsStock ? "bg-red-500/5" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-medium">{item.menuItemName}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={
                            (item.outletQty || 0) <= 5
                              ? "text-red-400 font-semibold"
                              : ""
                          }
                        >
                          {item.outletQty || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasData ? item.totalDataPoints : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.forecast !== null ? (
                          <span className="font-bold text-primary">
                            {item.forecast} pcs
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.mad > 0 ? (
                          <span className="text-muted-foreground">
                            {item.mad.toFixed(2)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.mse > 0 ? (
                          <span className="text-muted-foreground">
                            {item.mse.toFixed(2)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.mape > 0 ? (
                          <span className="text-muted-foreground">
                            {item.mape.toFixed(2)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!hasData ? (
                          <Badge className="bg-gray-500/20 text-gray-400">
                            Belum Ada Data
                          </Badge>
                        ) : needsStock ? (
                          <Badge className="bg-red-500/20 text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1 inline" />
                            Perlu Request
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                            Aman
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center print:hidden">
                        {hasData && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() =>
                              setExpandedItem(isExpanded ? null : item.menuItemId)
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && hasData && (
                      <tr key={`${item.menuItemId}-detail`}>
                        <td colSpan={9} className="p-0">
                          <div className="bg-accent/20 border-y border-border/30 p-4 animate-in slide-in-from-top-2">
                            {/* Shift Sales History */}
                            <p className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Riwayat Penjualan Per Shift (
                              {item.shiftSales.length} shift terakhir)
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-muted-foreground border-b border-border/30">
                                    <th className="text-left py-2 px-3 font-medium">
                                      Shift #
                                    </th>
                                    <th className="text-left py-2 px-3 font-medium">
                                      Buka Shift
                                    </th>
                                    <th className="text-left py-2 px-3 font-medium">
                                      <ArrowRight className="w-3 h-3 inline mr-1" />
                                      Tutup Shift
                                    </th>
                                    <th className="text-center py-2 px-3 font-medium">
                                      Qty Terjual
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.shiftSales.map((sale, idx) => (
                                    <tr
                                      key={sale.shiftId}
                                      className="border-b border-border/20 hover:bg-accent/20"
                                    >
                                      <td className="py-1.5 px-3 text-muted-foreground">
                                        #{idx + 1}
                                      </td>
                                      <td className="py-1.5 px-3">
                                        {formatDateTime(sale.startedAt)}
                                      </td>
                                      <td className="py-1.5 px-3">
                                        {formatDateTime(sale.endedAt)}
                                      </td>
                                      <td className="py-1.5 px-3 text-center font-medium">
                                        {sale.totalQty > 0 ? (
                                          <span className="text-primary">{sale.totalQty}</span>
                                        ) : (
                                          <span className="text-muted-foreground">0</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* WMA Calculation Detail Table */}
                            {(item.forecastDetails.length > 0 || item.nextForecast !== null) && (
                              <div className="mt-4">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="text-sm font-medium">
                                    Detail Perhitungan WMA (Periode {item.period})
                                  </p>
                                  {/* MAD, MSE, MAPE summary - positioned top right like spreadsheet */}
                                  <div className="text-xs border border-border/50 rounded-lg p-2.5 bg-background/50 space-y-1 min-w-[160px]">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground font-medium">MAD =</span>
                                      <span className="font-bold">{item.mad.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground font-medium">MSE =</span>
                                      <span className="font-bold">{item.mse.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-muted-foreground font-medium">MAPE =</span>
                                      <span className="font-bold">{item.mape.toFixed(2)}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-muted-foreground border-b border-border/30">
                                        <th className="text-center py-2 px-3 font-medium">
                                          Data #
                                        </th>
                                        <th className="text-center py-2 px-3 font-medium">
                                          Penjualan
                                        </th>
                                        <th className="text-center py-2 px-3 font-medium">
                                          Forecast WMA({item.period})
                                        </th>
                                        <th className="text-center py-2 px-3 font-medium">
                                          Error (At-Ft)
                                        </th>
                                        <th className="text-center py-2 px-3 font-medium">
                                          |Error|
                                        </th>
                                        <th className="text-center py-2 px-3 font-medium">
                                          Error²
                                        </th>
                                        <th className="text-center py-2 px-3 font-medium">
                                          Error (%)
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {/* Data rows before forecast starts (no forecast value) */}
                                      {item.shiftSales.slice(0, item.period).map((sale, idx) => (
                                        <tr
                                          key={`pre-${idx}`}
                                          className="border-b border-border/20"
                                        >
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            {idx + 1}
                                          </td>
                                          <td className="py-1.5 px-3 text-center">
                                            {sale.totalQty}
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                        </tr>
                                      ))}
                                      {/* Forecast detail rows */}
                                      {item.forecastDetails.map((fd, idx) => (
                                        <tr
                                          key={idx}
                                          className="border-b border-border/20"
                                        >
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            {fd.index + 1}
                                          </td>
                                          <td className="py-1.5 px-3 text-center">
                                            {fd.actual}
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-primary">
                                            {fd.forecast.toFixed(2)}
                                          </td>
                                          <td className="py-1.5 px-3 text-center">
                                            {fd.error.toFixed(2)}
                                          </td>
                                          <td className="py-1.5 px-3 text-center">
                                            {fd.absError.toFixed(2)}
                                          </td>
                                          <td className="py-1.5 px-3 text-center">
                                            {fd.squaredError.toFixed(2)}
                                          </td>
                                          <td className="py-1.5 px-3 text-center">
                                            {fd.percentError.toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                      {/* LAST ROW: Next shift forecast (prediction for tomorrow) */}
                                      {item.nextForecast !== null && (
                                        <tr className="border-b border-border/20 bg-primary/5 font-semibold">
                                          <td className="py-1.5 px-3 text-center text-primary">
                                            {item.totalDataPoints + 1}
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-primary font-bold">
                                            {item.forecastRaw?.toFixed(2)}
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                          <td className="py-1.5 px-3 text-center text-muted-foreground">
                                            —
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Conclusion Text */}
                                {item.conclusion && (
                                  <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <p className="text-sm text-blue-300 flex items-start gap-2">
                                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <span>{item.conclusion}</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Stock recommendation */}
                            {item.forecast !== null && needsStock && (
                              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-sm text-red-400 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  <strong>Rekomendasi:</strong> Stok outlet saat ini (
                                  {item.outletQty || 0}) kurang dari prediksi shift berikutnya
                                  ({item.forecast}). Perlu request minimal{" "}
                                  <strong>{item.forecast - (item.outletQty || 0)} pcs</strong>{" "}
                                  ke gudang.
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-muted-foreground mt-8">
        <p>Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
        <p>
          Metode: Weighted Moving Average (WMA) — Periode: {period} shift —
          Data: {data?.totalShifts || 0} shift ({lookbackDays} hari terakhir)
        </p>
        <p>Total Bobot: {(period * (period + 1)) / 2}</p>
        <p>Satuan data: Per-Shift (Buka Shift → Tutup Shift = 1 Data Point)</p>
      </div>
    </div>
  );
}
