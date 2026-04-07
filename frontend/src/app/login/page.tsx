"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Store } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api.login(email, password);
      localStorage.setItem("user", JSON.stringify(user));
      api.setUser(user.id);
      toast.success(`Selamat datang, ${user.name}!`);

      const routes: Record<string, string> = {
        admin: "/admin/dashboard",
        kasir: "/kasir/pos",
        gudang: "/gudang/dashboard",
      };
      router.push(routes[user.role] || "/login");
    } catch (err: any) {
      toast.error(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/8 blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-chart-2/8 blur-[100px] animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-chart-4/5 blur-[150px]" />

      <div className="w-full max-w-md relative animate-fade-in-up">
        <Card className="glass border-border/30 shadow-2xl shadow-black/30 animate-pulse-glow">
          <CardContent className="p-8 space-y-8">
            {/* Logo */}
            <div className="text-center space-y-3">
              <div className="mx-auto flex items-center justify-center animate-float -my-4">
                <img src="/mbg.svg" alt="Logo" className="w-32 h-32 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">POS System</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Masuk ke sistem kasir untuk memulai
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-background/40 border-border/40 text-base transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-background/40 border-border/40 text-base transition-all duration-200"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 btn-premium cursor-pointer transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Memproses…
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Role akan terdeteksi otomatis setelah login
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
