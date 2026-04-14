"use client";

import { AppSidebar } from "@/components/shared/AppSidebar";
import { RoleGuard } from "@/components/shared/RoleGuard";

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard requiredRole="kasir">
      <div className="flex min-h-screen bg-mesh">
        <AppSidebar role="kasir" />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </RoleGuard>
  );
}
