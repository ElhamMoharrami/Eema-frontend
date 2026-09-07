"use client";
import Link from "next/link";
import { usePolicyStatus } from "./PolicyStatusProvider";
export default function PolicyGate({children}:{children:React.ReactNode}){const{status,loading}=usePolicyStatus();if(loading)return <p className="text-sm text-taupe">Checking policy status…</p>;if(status&&!status.allRequiredAccepted)return <div className="border border-ochre bg-amber-50 p-4"><p className="text-sm font-semibold">Updated Eema policies require your review before you can continue with new marketplace actions.</p><Link href="/policies" className="btn mt-4 inline-block">Review updated policies</Link></div>;return <>{children}</>}
