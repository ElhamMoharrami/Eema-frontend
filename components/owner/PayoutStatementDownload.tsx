"use client";
import {useState} from "react";
import {downloadOwnerPayoutStatement} from "@/lib/api/owner-payouts";
import {documentErrorMessage} from "@/lib/api/document-error";
export default function PayoutStatementDownload({payoutId}:{payoutId:string}){const[busy,setBusy]=useState(false),[error,setError]=useState("");async function download(){setBusy(true);setError("");try{await downloadOwnerPayoutStatement(payoutId)}catch(e){setError(documentErrorMessage(e,"statement"))}finally{setBusy(false)}}return <div aria-busy={busy}><button className="btn btn-ochre" disabled={busy} onClick={()=>void download()} aria-label="Download payout statement">{busy?"Preparing statement…":"Download payout statement"}</button>{error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}</div>}
