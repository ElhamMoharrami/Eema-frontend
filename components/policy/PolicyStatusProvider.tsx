"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPolicyStatus } from "@/lib/api/policies";
import type { PolicyStatusDto, PolicyType } from "@/types/policy";

type Value={status:PolicyStatusDto|null;loading:boolean;missingTypes:PolicyType[];refresh:()=>Promise<PolicyStatusDto|null>};
const Context=createContext<Value|null>(null);
export default function PolicyStatusProvider({children}:{children:React.ReactNode}){
 const {user,isAuthReady}=useAuth();const[status,setStatus]=useState<PolicyStatusDto|null>(null),[loading,setLoading]=useState(false);
 const refresh=useCallback(async()=>{if(!user){setStatus(null);return null}setLoading(true);try{const value=await getPolicyStatus();setStatus(value);return value}catch{setStatus(null);return null}finally{setLoading(false)}},[user]);
 useEffect(()=>{if(isAuthReady)void refresh()},[isAuthReady,refresh]);
 useEffect(()=>{const stale=()=>{void refresh()};window.addEventListener("eema:policy-stale",stale);return()=>window.removeEventListener("eema:policy-stale",stale)},[refresh]);
 const value=useMemo<Value>(()=>({status,loading,missingTypes:status?.missing.map(x=>x.policyType)??[],refresh}),[status,loading,refresh]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePolicyStatus(){const value=useContext(Context);if(!value)throw new Error("usePolicyStatus must be used within PolicyStatusProvider");return value}
