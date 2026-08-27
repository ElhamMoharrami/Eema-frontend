"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import DashboardShell from "@/components/layout/DashboardShell";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { apiErrorMessage } from "@/lib/api/error-message";
import { createOwnerPayoutDestination, getOwnerPayoutDestinations } from "@/lib/api/payout-destinations";
import { getOwnerVerification } from "@/lib/api/trust";
import { formatTimestamp } from "@/lib/format";
import type { PayoutDestinationDto, PayoutDestinationStatus } from "@/types/payout-destination";
import type { OwnerVerificationDto } from "@/types/trust";

const LABELS: Record<PayoutDestinationStatus,string>={PENDING_VERIFICATION:"Under review",VERIFIED:"Verified",REJECTED:"Rejected",REPLACED:"Previous destination"};

export default function Page(){return <DashboardShell eyebrow="Owner account" title="Payout details" intro="Manage the verified bank destination Eema may use for manual owner payouts."><RoleGuard role="OWNER"><Destinations/></RoleGuard></DashboardShell>}

function Destinations(){
  const {user}=useAuth();
  const [items,setItems]=useState<PayoutDestinationDto[]>([]),[verification,setVerification]=useState<OwnerVerificationDto|null>(null);
  const [state,setState]=useState<"loading"|"ready"|"error">("loading"),[error,setError]=useState("");
  const [showForm,setShowForm]=useState(false),[holder,setHolder]=useState(""),[iban,setIban]=useState(""),[busy,setBusy]=useState(false),[actionError,setActionError]=useState("");
  const load=useCallback(async()=>{setState("loading");setError("");try{const[d,v]=await Promise.all([getOwnerPayoutDestinations(),getOwnerVerification()]);setItems(d);setVerification(v);setState("ready")}catch(e){setError(apiErrorMessage(e));setState("error")}},[]);
  useEffect(()=>{void load();return()=>setIban("")},[load]);
  async function submit(e:FormEvent){e.preventDefault();if(!holder.trim()||iban.replaceAll(" ","").length<12)return;setBusy(true);setActionError("");try{await createOwnerPayoutDestination({accountHolderName:holder.trim(),iban});setIban("");setHolder("");setShowForm(false);await load()}catch(reason){setActionError(ownerError(reason))}finally{setBusy(false)}}
  if(state==="loading")return <LoadingState label="Loading payout details…"/>;
  if(state==="error")return <ErrorState title="Could not load payout details" message={error} onRetry={()=>void load()}/>;
  const verified=items.find(x=>x.status==="VERIFIED"),pending=items.filter(x=>x.status==="PENDING_VERIFICATION"),history=items.filter(x=>x.status==="REJECTED"||x.status==="REPLACED");
  const eligible=user?.emailVerified&&verification?.status==="VERIFIED";
  return <div className="grid gap-7">
    {!eligible&&<section className="max-w-3xl border border-ochre bg-amber-50 p-6"><h2 className="font-display text-2xl">Complete owner verification before adding payout details.</h2><p className="mt-3 text-sm text-ink/75">A verified email and completed Eema owner review are required before Eema collects a payout destination.</p><Link href="/owner/verification" className="btn mt-5 inline-block">Complete owner verification</Link></section>}
    {verified&&<DestinationCard destination={verified} title="Payout destination verified" copy="Eema has verified this payout destination."/>}
    {pending.map(d=><DestinationCard key={d.id} destination={d} title="Payout details under review" copy={verified||d.anotherVerifiedDestinationExists?"Your existing verified payout destination remains active until these new details are reviewed and approved.":"Payouts cannot become ready using this destination until Eema verifies it."}/>)}
    {!items.length&&eligible&&!showForm&&<section className="max-w-3xl border border-rule bg-paper p-7"><h2 className="font-display text-3xl">Add payout details</h2><p className="mt-3 text-sm text-ink/75">Eema uses these details for manual owner payouts. Your bank destination must be reviewed before payouts can become ready.</p><button className="btn btn-ochre mt-5" onClick={()=>setShowForm(true)}>Add payout details</button></section>}
    {eligible&&verified&&!pending.length&&!showForm&&<section><button className="btn" onClick={()=>setShowForm(true)}>Change payout details</button><p className="mt-3 text-sm text-ink/70">Your current verified payout destination remains active until the new details are reviewed and approved.</p></section>}
    {eligible&&history.some(x=>x.status==="REJECTED")&&!pending.length&&!showForm&&<button className="btn w-fit" onClick={()=>setShowForm(true)}>Submit new payout details</button>}
    {showForm&&eligible&&<form onSubmit={submit} className="max-w-3xl border border-rule bg-paper p-7"><h2 className="font-display text-3xl">{verified?"Change payout details":"Add payout details"}</h2>{verified&&<p className="mt-3 text-sm text-ink/75">The current verified destination stays active during Eema review.</p>}<label className="label label-ink mt-6 block" htmlFor="account-holder">Account holder name<input id="account-holder" className="form-input" value={holder} onChange={e=>setHolder(e.target.value)} maxLength={160} autoComplete="name" required disabled={busy}/></label><label className="label label-ink mt-5 block" htmlFor="iban">IBAN<input id="iban" className="form-input font-mono" value={iban} onChange={e=>setIban(e.target.value)} maxLength={80} autoComplete="off" autoCapitalize="characters" spellCheck={false} required disabled={busy}/></label><p className="mt-2 text-xs text-taupe">Spaces and lowercase letters are accepted. Spring validates and normalizes the IBAN securely.</p>{actionError&&<p role="alert" className="mt-4 text-sm text-red-800">{actionError}</p>}<div className="mt-6 flex gap-3"><button className="btn btn-ochre" disabled={busy}>{busy?"Submitting…":"Submit for verification"}</button><button type="button" className="btn" disabled={busy} onClick={()=>{setIban("");setHolder("");setActionError("");setShowForm(false)}}>Cancel</button></div></form>}
    {history.length>0&&<section><h2 className="font-display text-2xl">Destination history</h2><div className="mt-4 grid gap-4">{history.map(d=><DestinationCard key={d.id} destination={d} title={d.status==="REPLACED"?"Previous payout destination":"Payout details need attention"} copy={d.status==="REPLACED"?"This historical destination cannot be restored or edited.":"Submit new payout details when the issue below has been addressed."}/>)}</div></section>}
  </div>;
}

function DestinationCard({destination:d,title,copy}:{destination:PayoutDestinationDto;title:string;copy:string}){return <article className="max-w-3xl border border-rule bg-paper p-6"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-display text-2xl">{title}</h2><span className="border border-rule px-3 py-2 text-xs font-semibold uppercase tracking-wider">{LABELS[d.status]}</span></div><p className="mt-3 text-sm text-ink/75">{copy}</p><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Fact label="Account holder" value={d.accountHolderName}/><Fact label="Masked IBAN" value={d.maskedIban} mono/><Fact label="Submitted" value={formatTimestamp(d.submittedAt)}/>{d.verifiedAt&&<Fact label="Verified" value={formatTimestamp(d.verifiedAt)}/>} {d.replacedAt&&<Fact label="Replaced" value={formatTimestamp(d.replacedAt)}/>}</dl>{d.status==="REJECTED"&&d.rejectionReason&&<div className="mt-5 border-l-2 border-ochre bg-paperDeep p-4"><div className="label">Reason</div><p className="mt-2 text-sm">{d.rejectionReason}</p></div>}</article>}
function Fact({label,value,mono=false}:{label:string;value:string;mono?:boolean}){return <div><dt className="label">{label}</dt><dd className={`mt-1 text-sm ${mono?"font-mono":""}`}>{value}</dd></div>}
function ownerError(error:unknown){const message=apiErrorMessage(error);if(message.toLowerCase().includes("forbidden"))return "Owner verification is required before adding payout details.";return message}
