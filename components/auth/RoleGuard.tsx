"use client";

import AuthPanel from "./AuthPanel";
import { useAuth } from "./AuthProvider";
import type { UserRole } from "@/types/auth";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";

export default function RoleGuard({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.isAuthReady) return <LoadingState label="Checking your account…" />;
  if (!auth.user) return <div className="mx-auto max-w-[560px]"><AuthPanel onAuthenticated={() => undefined} /></div>;
  if (auth.user.role !== role) {
    const account = role === "OWNER" ? "owner" : role === "SCOUT" ? "scout" : "ADMIN";
    return <ErrorState title={role === "ADMIN" ? "ADMIN access required" : "This area is not available for your account"} message={`Sign in with an ${account} account to continue.`} />;
  }
  return <>{children}</>;
}
