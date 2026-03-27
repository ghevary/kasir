"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { MenuItem, CartItem, Shift } from "@/types";
import { toast } from "sonner";
import { Unlock, Image as ImageIcon, Utensils, ShoppingCart, Banknote, Smartphone, Trash2, CheckCircle } from "lucide-react";

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

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
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

      // If QRIS with Midtrans token, open Snap popup
      if (result.midtransToken && typeof window !== "undefined") {
        // @ts-ignore
        window.snap?.pay(result.midtransToken);
      }

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

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      {/* Left: Menu Catalog */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div className="flex items-center gap-4">
          <Input
            placeholder="🔍 Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-11 bg-card/50 border-border/50"
          />
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
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
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
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
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
              disabled={item.stockQty <= 0}
              className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                item.stockQty <= 0
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
                Stok: {item.stockQty}
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
                    className="w-7 h-7 rounded-md bg-accent/50 flex items-center justify-center text-sm hover:bg-accent transition-colors"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">
                    {cartItem.qty}
                  </span>
                  <button
                    onClick={() => updateQty(cartItem.menuItem.id, 1)}
                    className="w-7 h-7 rounded-md bg-accent/50 flex items-center justify-center text-sm hover:bg-accent transition-colors"
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

          {/* Payment Method */}
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                paymentMethod === "cash"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-card border border-border/50 text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <Banknote className="w-4 h-4 mr-2 inline" /> Cash
            </button>
            <button
              onClick={() => setPaymentMethod("qris")}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                paymentMethod === "qris"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-card border border-border/50 text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <Smartphone className="w-4 h-4 mr-2 inline" /> QRIS
            </button>
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
