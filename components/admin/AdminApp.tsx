"use client";

import { Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LoginForm } from "@/components/admin/LoginForm";
import { Toast } from "@/components/admin/shared/Toast";
import { Workspace } from "@/components/admin/Workspace";
import { AdminProvider, useAdmin } from "@/hooks/useAdmin";

function AdminShell() {
  const {
    sessionChecked,
    authenticated,
    section,
    toast,
    dismissToast,
    navigate,
    logout
  } = useAdmin();

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="size-6 animate-spin text-zinc-500" strokeWidth={1.75} />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginForm />;
  }

  return (
    <div className="flex min-h-screen items-stretch bg-black">
      <AdminSidebar
        activeId={section.id}
        onNavigate={navigate}
        onSettings={() => {}}
        onLogout={logout}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <Workspace />
      </main>
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export function AdminApp() {
  return (
    <AdminProvider>
      <AdminShell />
    </AdminProvider>
  );
}
