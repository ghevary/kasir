"use client";

import { AppSidebar } from "@/components/shared/AppSidebar";
import { RoleGuard } from "@/components/shared/RoleGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard requiredRole="admin">
      <div className="flex min-h-screen bg-mesh">
        <AppSidebar role="admin" />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </RoleGuard>
  );
}
