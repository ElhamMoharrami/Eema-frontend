"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { apiErrorMessage } from "@/lib/api/error-message";
export type LoadState = "loading"|"ready"|"forbidden"|"expired"|"not-found"|"error";

export function useAdminPage<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const generation = useRef(0);
  const load = useCallback(async () => {
    const request = ++generation.current;
    setState("loading");
    setError("");
    try {
      const result = await loader();
      if (request !== generation.current) return;
      setData(result);
      setState("ready");
    } catch (e) {
      if (request !== generation.current) return;
      setData(null);
      if (e instanceof ApiError && e.status === 401) setState("expired");
      else if (e instanceof ApiError && e.status === 403) setState("forbidden");
      else if (e instanceof ApiError && e.status === 404) setState("not-found");
      else { setError(apiErrorMessage(e)); setState("error"); }
    }
  }, [loader]);
  useEffect(() => {
    void load();
    return () => { generation.current++; };
  }, [load]);
  return { data, state, error, load };
}
