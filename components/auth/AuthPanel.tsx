"use client";

import Link from "next/link";
import { useState } from "react";
import { login, register } from "@/lib/api/auth";
import { apiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "./AuthProvider";
import type { User, UserRole } from "@/types/auth";

type Props = {
  onAuthenticated: (user: User) => void;
  onCancel?: () => void;
};

export default function AuthPanel({ onAuthenticated, onCancel }: Props) {
  const { completeSession } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "ADMIN">>("SCOUT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = mode === "login"
        ? await login({ email, password })
        : await register({ email, password, fullName, role });
      completeSession(response);
      onAuthenticated(response.user);
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="settle border border-rule bg-paper p-7 md:p-9">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="label label-ink">Sign in to continue</div>
          <p className="mt-2 text-sm text-taupe">Matching and booking use your secure Eema account.</p>
        </div>
        {onCancel && <button type="button" onClick={onCancel} className="label hover:text-ink">Close</button>}
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => setMode("login")} className={mode === "login" ? "chip border-ink" : "chip"}>Sign in</button>
        <button type="button" onClick={() => setMode("register")} className={mode === "register" ? "chip border-ink" : "chip"}>Create account</button>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="mt-6 grid gap-4">
        {mode === "register" && (
          <>
            <label className="label label-ink">Full name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={120} required className="mt-2 block w-full border-b border-ink/60 bg-transparent py-2 font-sans text-base normal-case tracking-normal" />
            </label>
            <label className="label label-ink">Account type
              <select value={role} onChange={(event) => setRole(event.target.value as Exclude<UserRole, "ADMIN">)} className="mt-2 block w-full border-b border-ink/60 bg-transparent py-2 font-sans text-base normal-case tracking-normal">
                <option value="SCOUT">Scout</option>
                <option value="OWNER">Venue owner</option>
              </select>
            </label>
          </>
        )}
        <label className="label label-ink">Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 block w-full border-b border-ink/60 bg-transparent py-2 font-sans text-base normal-case tracking-normal" />
        </label>
        <label className="label label-ink">Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={72} required className="mt-2 block w-full border-b border-ink/60 bg-transparent py-2 font-sans text-base normal-case tracking-normal" />
        </label>
        {error && <p className="text-sm text-ochreDeep">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-ochre mt-2">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        {mode === "login" && <Link href="/forgot-password" className="text-sm text-ochre hover:underline">Forgot password?</Link>}
      </form>
    </section>
  );
}
