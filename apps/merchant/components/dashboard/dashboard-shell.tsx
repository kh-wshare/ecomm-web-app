"use client";

import { useEffect } from "react";

import { DashboardLoading } from "./dashboard-loading";
import { DashboardSidebar } from "./dashboard-sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { TopNavigation } from "./top-navigation";

import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useUiStore } from "@/stores/ui-store";

export function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { activeMerchant, isAuthenticated, isChecking } = useAuthSession();
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);

  useEffect(() => {
    if (isChecking || isAuthenticated) return;

    const next = window.location.pathname + window.location.search;
    const target = `/merchant/auth/login?next=${encodeURIComponent(next)}`;

    if (window.location.pathname === "/merchant/auth/login") return;
    window.location.replace(target);
  }, [isAuthenticated, isChecking]);

  if (isChecking || !isAuthenticated) return <DashboardLoading />;

  const content = (
    <div className="min-h-dvh bg-background">
      <DashboardSidebar />
      <MobileNavigation />
      <div
        className={`min-h-dvh transition-[padding] duration-200 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <TopNavigation />
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );

  if (!activeMerchant) return content;

  return (
    <RealtimeProvider
      merchantId={activeMerchant.merchant.id}
      permissions={activeMerchant.permissions}
    >
      {content}
    </RealtimeProvider>
  );
}
