"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const roleRoutes: Record<string, string> = {
  admin: "/admin/dashboard",
  kasir: "/kasir/pos",
  gudang: "/gudang/dashboard",
};

export function RoleGuard({
  requiredRole,
  children,
}: {
  requiredRole: "admin" | "kasir" | "gudang";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(stored);
      if (user.role !== requiredRole) {
        // Redirect to the correct dashboard for their actual role
        const correctRoute = roleRoutes[user.role] || "/login";
        router.replace(correctRoute);
        return;
      }
      setAuthorized(true);
    } catch {
      router.replace("/login");
    } finally {
      setChecking(false);
    }
  }, [requiredRole, router]);

  if (checking || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mesh">
        <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
