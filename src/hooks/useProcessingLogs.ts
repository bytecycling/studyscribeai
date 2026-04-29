import { useCallback, useRef, useState } from "react";
import type { ProcessingLog } from "@/components/GeneratingLoader";

export function useProcessingLogs() {
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const cancelledRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setLogs([]);
    cancelledRef.current = false;
    controllerRef.current = new AbortController();
  }, []);

  const pushLog = useCallback((message: string) => {
    setLogs(prev => {
      // mark previous as done
      const updated = prev.map(l => ({ ...l, done: true }));
      return [...updated, { ts: Date.now(), message, done: false }];
    });
  }, []);

  const finishAll = useCallback(() => {
    setLogs(prev => prev.map(l => ({ ...l, done: true })));
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    controllerRef.current?.abort();
  }, []);

  const isCancelled = useCallback(() => cancelledRef.current, []);

  const checkCancel = useCallback(() => {
    if (cancelledRef.current) {
      throw new Error("__cancelled__");
    }
  }, []);

  return { logs, pushLog, finishAll, reset, cancel, isCancelled, checkCancel, signal: () => controllerRef.current?.signal };
}
