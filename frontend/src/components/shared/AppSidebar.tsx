"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  LayoutDashboard,
  Utensils,
  Package,
  FileText,
  Users as UsersIcon,
  ShoppingCart,
  History,
  Lock,
  Send,
  BarChart,
  Inbox,
  Upload,
  Store,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  children?: { label: string; href: string }[];
}

const adminNav: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, href: "/admin/dashboard" },
  {
    label: "Menu",
    icon: <Utensils className="w-5 h-5" />,
    href: "/admin/menu",
    children: [
      { label: "Kategori", href: "/admin/menu/categories" },
      { label: "Menu Items", href: "/admin/menu/items" },
    ],
  },
  {
    label: "Stok",
    icon: <Package className="w-5 h-5" />,
    href: "/admin/stock",
    children: [
      { label: "Monitor", href: "/admin/stock/monitor" },
      { label: "Barang Masuk", href: "/admin/stock/in" },
    ],
  },
  {
    label: "Laporan",
    icon: <FileText className="w-5 h-5" />,
    href: "/admin/reports",
    children: [
      { label: "Penjualan & Keuangan", href: "/admin/reports/sales" },
      { label: "Stok Masuk", href: "/admin/reports/stock-in" },
      { label: "Stok Keluar", href: "/admin/reports/stock-out" },
    ],
  },
];

const kasirNav: NavItem[] = [
  { label: "POS", icon: <ShoppingCart className="w-5 h-5" />, href: "/kasir/pos" },
  {
    label: "Riwayat",
    icon: <History className="w-5 h-5" />,
    href: "/kasir/history",
    children: [
      { label: "Penjualan", href: "/kasir/history/sales" },
      { label: "Keuangan", href: "/kasir/history/financial" },
    ],
  },
  { label: "Shift", icon: <Lock className="w-5 h-5" />, href: "/kasir/shift" },
  { label: "Request Bahan", icon: <Send className="w-5 h-5" />, href: "/kasir/request" },
  { label: "Lap. Harian", icon: <BarChart className="w-5 h-5" />, href: "/kasir/report/daily" },
];

const gudangNav: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, href: "/gudang/dashboard" },
  { label: "Request", icon: <Inbox className="w-5 h-5" />, href: "/gudang/requests" },
  {
    label: "Stok Keluar",
    icon: <Upload className="w-5 h-5" />,
    href: "/gudang/stock-out",
    children: [
      { label: "Input", href: "/gudang/stock-out/input" },
      { label: "Riwayat", href: "/gudang/stock-out/history" },
    ],
  },
  { label: "Laporan", icon: <FileText className="w-5 h-5" />, href: "/gudang/report" },
];

export function AppSidebar({ role }: { role: "admin" | "kasir" | "gudang" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      api.setUser(u.id);
    }
  }, []);

  const navItems =
    role === "admin" ? adminNav : role === "kasir" ? kasirNav : gudangNav;

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const roleLabels = { admin: "Admin", kasir: "Kasir", gudang: "Gudang" };
  const roleColors = { admin: "bg-red-500/10 text-red-400", kasir: "bg-yellow-500/10 text-yellow-400", gudang: "bg-green-500/10 text-green-400" };

  return (
    <aside className="w-64 min-h-screen bg-card/50 backdrop-blur-sm border-r border-border/50 flex flex-col sidebar-glow animate-slide-in-left">
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 animate-float text-primary-foreground">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">POS System</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[role]}`}>
              {roleLabels[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isOpen = openMenus[item.label] ?? isActive;

          return (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-0.5"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className="ml-8 mt-1 space-y-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-3 py-2 rounded-md text-sm transition-all ${
                            pathname === child.href
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-0.5"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
