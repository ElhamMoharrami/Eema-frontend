"use client";
import Link from "next/link";
import {FormEvent, Suspense, useState} from "react";
import {useSearchParams} from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import LoadingState from "@/components/ui/LoadingState";
import {resetPassword} from "@/lib/api/auth";
import {ApiError} from "@/lib/api/client";
import {useAuth} from "@/components/auth/AuthProvider";

export default function Page() {
    return <main className="mx-auto max-w-[900px] px-6 py-10"><AppHeader/><Suspense fallback={<LoadingState/>}><Reset/></Suspense>
    </main>
}

function Reset() {
    const token = useSearchParams().get("token"), {logout} = useAuth();
    const [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [busy, setBusy] = useState(false), [state, setState] = useState<"form" | "success" | "invalid">(token ? "form" : "invalid"), [error, setError] = useState("");

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (password.length < 8 || password.length > 72) {
            setError("Password must be 8–72 characters.");
            return
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return
        }
        setBusy(true);
        setError("");
        try {
            await resetPassword(token!, password);
            logout();
            setState("success")
        } catch (x) {
            if (x instanceof ApiError && (x.status === 400 || x.status === 404 || x.status === 409)) setState("invalid"); else setError("Password reset is temporarily unavailable. Please try again.")
        } finally {
            setBusy(false)
        }
    }

    return <section className="mx-auto mt-14 max-w-lg border border-rule bg-paper p-8">{state === "success" ? <><h1
        className="font-display text-4xl">Your password has been reset.</h1><Link href="/"
                                                                                  className="btn btn-ochre mt-6 inline-block">Sign
        in</Link></> : state === "invalid" ? <><h1 className="font-display text-4xl">Invalid reset link</h1><p
        className="mt-4 text-sm">This password-reset link is invalid or has expired.</p><Link href="/forgot-password"
                                                                                              className="btn mt-6 inline-block">Request
        another reset</Link></> : <><h1 className="font-display text-4xl">Reset password</h1>
        <form className="mt-6 grid gap-5" onSubmit={e => void submit(e)}><label className="label label-ink">New password<input
            className="form-input" type="password" autoComplete="new-password" minLength={8} maxLength={72} required
            value={password} onChange={e => setPassword(e.target.value)}/></label><label className="label label-ink">Confirm
            new password<input className="form-input" type="password" autoComplete="new-password" minLength={8}
                               maxLength={72} required value={confirm}
                               onChange={e => setConfirm(e.target.value)}/></label>{error &&
            <p role="alert" className="text-sm text-ochreDeep">{error}</p>}
            <button className="btn btn-ochre" disabled={busy}>{busy ? "Resetting…" : "Reset password"}</button>
        </form>
    </>}</section>
}
