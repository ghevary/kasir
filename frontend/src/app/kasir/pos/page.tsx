"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { MenuItem, CartItem, Shift } from "@/types";
import { toast } from "sonner";
import {
  Unlock,
  Image as ImageIcon,
  Utensils,
  ShoppingCart,
  Banknote,
  Smartphone,
  Trash2,
  CheckCircle,
  Printer,
  X,
  Search,
} from "lucide-react";

interface ReceiptData {
  transaction: any;
  items: any[];
  changeAmount: number;
  paidAmount: number;
}

export default function KasirPOS() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [items, cats, shift] = await Promise.all([
        api.getActiveMenuItems().catch(() => []),
        api.getCategories().catch(() => []),
        api.getActiveShift().catch(() => null),
      ]);
      setMenuItems(items);
      setCategories(cats);
      setActiveShift(shift);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    try {
      const shift = await api.openShift();
      setActiveShift(shift);
      toast.success("Shift berhasil dibuka!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { menuItem: item, qty: 1 }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId ? { ...c, qty: Math.max(0, c.qty + delta) } : c
        )
        .filter((c) => c.qty > 0)
    );
  };

  const subtotal = cart.reduce(
    (sum, c) => sum + parseFloat(c.menuItem.price) * c.qty,
    0
  );

  const changeAmount =
    paymentMethod === "cash"
      ? Math.max(parseFloat(paidAmount || "0") - subtotal, 0)
      : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Tambahkan item terlebih dahulu");
    if (paymentMethod === "cash" && parseFloat(paidAmount || "0") < subtotal) {
      return toast.error("Nominal pembayaran kurang");
    }

    setProcessing(true);
    try {
      const result = await api.createTransaction({
        customerName: customerName || "Umum",
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          qty: c.qty,
        })),
        paymentMethod,
        paidAmount: paymentMethod === "cash" ? paidAmount : subtotal.toString(),
      });

      toast.success("Transaksi berhasil!");

      // Show receipt
      setReceipt({
        transaction: result.transaction,
        items: result.items,
        changeAmount: paymentMethod === "cash" ? changeAmount : 0,
        paidAmount: paymentMethod === "cash" ? parseFloat(paidAmount || "0") : subtotal,
      });

      // Reset form
      setCart([]);
      setCustomerName("");
      setPaidAmount("");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pembayaran</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 10px; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .item-name { margin: 4px 0 0 0; font-weight: 600; }
          .item-detail { display: flex; justify-content: space-between; color: #555; font-size: 11px; }
          h2 { font-size: 16px; margin-bottom: 4px; }
          .footer { margin-top: 12px; font-size: 10px; }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const filteredItems = menuItems.filter((item) => {
    const matchSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchCategory = !selectedCategory || item.categoryId === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  // Show shift opener if no active shift
  if (!activeShift) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Card className="w-full max-w-md text-center border-border/50">
          <CardContent className="p-10 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary">
              <Unlock className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Buka Shift</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Anda harus membuka shift terlebih dahulu sebelum memulai transaksi
              </p>
            </div>
            <Button
              onClick={handleOpenShift}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 cursor-pointer"
            >
              <Unlock className="w-5 h-5 mr-2 inline" /> Buka Shift Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Receipt Modal
  if (receipt) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-border/50 bg-card shadow-2xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Struk Pembayaran</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReceipt(null)}
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Printable receipt content */}
            <div ref={receiptRef} className="text-sm space-y-2">
              <div className="text-center">
                <h2 className="font-bold text-base">POS System</h2>
                <p className="text-muted-foreground text-xs">Struk Pembayaran</p>
              </div>

              <div className="border-t border-dashed border-border my-2" />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tanggal</span>
                <span>{new Date(receipt.transaction.createdAt).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Pelanggan</span>
                <span>{receipt.transaction.customerName}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Metode</span>
                <span className="uppercase font-semibold">{receipt.transaction.paymentMethod}</span>
              </div>

              <div className="border-t border-dashed border-border my-2" />

              {receipt.items.map((item: any, i: number) => (
                <div key={i}>
                  <p className="font-medium">{item.name}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.qty} x {formatRupiah(parseFloat(item.unitPrice))}</span>
                    <span>{formatRupiah(parseFloat(item.subtotal))}</span>
                  </div>
                </div>
              ))}

              <div className="border-t border-dashed border-border my-2" />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{formatRupiah(parseFloat(receipt.transaction.totalAmount))}</span>
              </div>

              {receipt.transaction.paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Bayar</span>
                    <span>{formatRupiah(receipt.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kembalian</span>
                    <span className="text-emerald-400 font-semibold">{formatRupiah(receipt.changeAmount)}</span>
                  </div>
                </>
              )}

              <div className="border-t border-dashed border-border my-2" />

              <div className="text-center text-xs text-muted-foreground mt-3">
                <p>Terima kasih atas kunjungan Anda!</p>
                <p className="mt-1">— POS System —</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setReceipt(null)}
                className="flex-1 cursor-pointer"
              >
                <X className="w-4 h-4 mr-1" /> Tutup
              </Button>
              <Button
                onClick={handlePrintReceipt}
                className="flex-1 bg-primary cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1" /> Cetak Struk
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      {/* Left: Menu Catalog */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-card/50 border-border/50"
            />
          </div>
          <Input
            placeholder="Nama Pembeli"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-48 h-11 bg-card/50 border-border/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-card/50 text-muted-foreground hover:bg-accent/50"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/50 text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start pr-1">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              disabled={(item.outletQty || 0) <= 0}
              className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                (item.outletQty || 0) <= 0
                  ? "opacity-50 cursor-not-allowed border-border/30"
                  : "border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer bg-card/50"
              }`}
            >
              <div className="mb-3 text-muted-foreground">
                {item.imageUrl ? <ImageIcon className="w-8 h-8" /> : <Utensils className="w-8 h-8" />}
              </div>
              <h3 className="font-semibold text-sm truncate">{item.name}</h3>
              <p className="text-primary font-bold text-sm mt-1">
                {formatRupiah(parseFloat(item.price))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Stok: {item.outletQty || 0}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <Card className="w-96 flex flex-col border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pesanan</CardTitle>
            <Badge variant="outline" className="text-xs">
              Shift #{activeShift.id.slice(0, 8)}
            </Badge>
          </div>
          {customerName && (
            <p className="text-sm text-muted-foreground">
              Pelanggan: {customerName}
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              Belum ada item. Klik menu untuk menambahkan.
            </div>
          ) : (
            cart.map((cartItem) => (
              <div
                key={cartItem.menuItem.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {cartItem.menuItem.name}
                  </p>
                  <p className="text-xs text-primary">
                    {formatRupiah(parseFloat(cartItem.menuItem.price))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(cartItem.menuItem.id, -1)}
                    className="w-7 h-7 rounded-md bg-accent/50 flex items-center justify-center text-sm hover:bg-accent transition-colors cursor-pointer"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">
                    {cartItem.qty}
                  </span>
                  <button
                    onClick={() => updateQty(cartItem.menuItem.id, 1)}
                    className="w-7 h-7 rounded-md bg-accent/50 flex items-center justify-center text-sm hover:bg-accent transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-semibold w-24 text-right">
                  {formatRupiah(parseFloat(cartItem.menuItem.price) * cartItem.qty)}
                </p>
              </div>
            ))
          )}
        </CardContent>

        {/* Payment Section */}
        <div className="border-t border-border/50 p-4 space-y-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatRupiah(subtotal)}</span>
          </div>

          <Separator />

          {/* Cash Payment Info */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1 py-2 text-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-semibold">
              <Banknote className="w-4 h-4 mr-2 inline" /> Pembayaran Cash
            </div>
          </div>

          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Nominal Cash"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="h-11 bg-background/50 text-lg font-semibold"
              />
              {parseFloat(paidAmount || "0") > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kembalian</span>
                  <span className="font-semibold text-emerald-400">
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === "qris" && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <Smartphone className="w-6 h-6 mx-auto text-blue-400 mb-1" />
              <p className="text-xs text-blue-300">Pembayaran QRIS akan dicatat secara manual</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCart([]);
                setCustomerName("");
                setPaidAmount("");
              }}
              className="flex-1 h-12 cursor-pointer"
              disabled={cart.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Batal
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 cursor-pointer"
            >
              {processing ? "Memproses..." : <><CheckCircle className="w-4 h-4 mr-2 inline" /> Bayar</>}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
