"use client";

import { AppSidebar } from "@/components/shared/AppSidebar";

export default function GudangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-mesh">
      <AppSidebar role="gudang" />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
