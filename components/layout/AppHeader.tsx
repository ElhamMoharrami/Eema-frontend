"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { roleLabel } from "@/lib/roles";

export default function AppHeader({ onSignIn }: { onSignIn?: () => void }) {
  const { user, isAuthReady, logout } = useAuth();
  return <header className="flex flex-wrap items-baseline justify-between gap-5">
    <Link href="/" className="text-left"><div className="font-display text-3xl tracking-tight">Eema<span className="text-ochre">.</span></div><div className="label mt-1">Venue marketplace · Europe</div></Link>
    <nav className="flex flex-wrap items-baseline justify-end gap-5">
      <Link href="/" className="label hover:text-ink">Marketplace</Link>
      {user?.role === "SCOUT" && <><Link href="/scout/bookings" className="label hover:text-ink">My bookings</Link><Link href="/scout/inquiries" className="label hover:text-ink">Inquiries</Link></>}
      {user?.role === "OWNER" && <><Link href="/owner/venues" className="label hover:text-ink">My venues</Link><Link href="/owner/verification" className="label hover:text-ink">Verification</Link><Link href="/owner/bookings" className="label hover:text-ink">Venue bookings</Link><Link href="/owner/payouts" className="label hover:text-ink">Payouts</Link><Link href="/owner/inquiries" className="label hover:text-ink">Inquiries</Link></>}
      {user?.role === "ADMIN" && <><Link href="/admin" className="label hover:text-ink">Operations</Link><Link href="/admin/bookings" className="label hover:text-ink">Bookings</Link><Link href="/admin/payouts" className="label hover:text-ink">Payouts</Link><Link href="/admin/liabilities" className="label hover:text-ink">Liabilities</Link><Link href="/admin/exceptions" className="label hover:text-ink">Exceptions</Link><Link href="/admin/owner-verifications" className="label hover:text-ink">Owner verification</Link><Link href="/admin/venues" className="label hover:text-ink">Venue moderation</Link></>}
      {isAuthReady && user ? <><span className="label label-ink">{user.fullName} · {roleLabel(user.role)}</span>{!user.emailVerified&&<span className="label label-ochre">Email not verified</span>}<button onClick={logout} className="label hover:text-ink">Sign out</button></> : isAuthReady && (onSignIn ? <button onClick={onSignIn} className="label hover:text-ink">Sign in / register</button> : <Link href="/" className="label hover:text-ink">Sign in / register</Link>)}
    </nav>
  </header>;
}
