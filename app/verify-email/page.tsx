"use client";
import Link from "next/link";
import {Suspense, useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import LoadingState from "@/components/ui/LoadingState";
import {verifyEmail} from "@/lib/api/auth";
import {ApiError} from "@/lib/api/client";
import {useAuth} from "@/components/auth/AuthProvider";

export default function Page() {
    return <Shell><Suspense fallback={<LoadingState label="Verifying…"/>}><Verify/></Suspense></Shell>
}

function Verify() {
    const token = useSearchParams().get("token"), {refreshUser} = useAuth();
    const [state, setState] = useState<"verifying" | "success" | "invalid" | "error">(token ? "verifying" : "invalid");
    useEffect(() => {
        if (!token) return;
        let active = true;
        verifyEmail(token).then(async () => {
            await refreshUser();
            if (active) setState("success")
        }).catch(e => {
            if (active) setState(e instanceof ApiError && (e.status === 400 || e.status === 404 || e.status === 409) ? "invalid" : "error")
        });
        return () => {
            active = false
        }
    }, [token, refreshUser]);
    if (state === "verifying") return <LoadingState label="Verifying…"/>;
    if (state === "success") return <Message title="Email verified"
                                             text="Your email has been verified successfully."><Link
        className="btn btn-ochre mt-6 inline-block" href="/">Continue to Eema</Link></Message>;
    if (state === "invalid") return <Message title="Invalid or expired verification link"
                                             text="This verification link is invalid or has expired."/>;
    return <Message title="Temporary error"
                    text="Email verification is temporarily unavailable. Please try the link again later."/>
}

function Shell({children}: { children: React.ReactNode }) {
    return <main className="mx-auto max-w-[900px] px-6 py-10"><AppHeader/>
        <div className="mt-14">{children}</div>
    </main>
}

function Message({title, text, children}: { title: string; text: string; children?: React.ReactNode }) {
    return <section className="border border-rule bg-paper p-8 text-center"><h1
        className="font-display text-4xl">{title}</h1><p className="mt-4 text-sm text-taupe">{text}</p>{children}
    </section>
}
