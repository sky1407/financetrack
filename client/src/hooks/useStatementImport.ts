import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetImport, apiStartImport } from "@/api/imports";
import type { ImportStatus } from "@/types";

const ACTIVE_STATUSES: readonly ImportStatus[] = ["PENDING", "PROCESSING"];
const POLL_INTERVAL_MS = 1000;
/** Stop polling after ~2 minutes so a stalled worker cannot keep the tab polling forever. */
const MAX_POLLS = 120;

/** Starts a statement import and polls its status until the background job finishes. */
export function useStatementImport() {
  const queryClient = useQueryClient();
  const [importId, setImportId] = useState<string | null>(null);

  const startMutation = useMutation({
    mutationFn: ({ accountId, file }: { accountId: string; file: File | null }) => apiStartImport(accountId, file),
    onSuccess: (batch) => {
      queryClient.setQueryData(["imports", batch.id], batch);
      setImportId(batch.id);
    },
  });

  const statusQuery = useQuery({
    queryKey: ["imports", importId],
    queryFn: () => apiGetImport(importId as string),
    enabled: importId !== null,
    refetchInterval: (query) =>
      query.state.data && ACTIVE_STATUSES.includes(query.state.data.status) && query.state.dataUpdateCount < MAX_POLLS
        ? POLL_INTERVAL_MS
        : false,
  });

  const result = importId ? statusQuery.data : undefined;
  const status = result?.status;

  // New transactions (and possibly the "Nezaradené" categories) change every derived view.
  useEffect(() => {
    if (status !== "DONE") return;
    for (const key of ["transactions", "accounts", "dashboard", "budgets", "categories"]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [status, importId, queryClient]);

  function reset() {
    setImportId(null);
    startMutation.reset();
  }

  return {
    startImport: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    result,
    isProcessing: status !== undefined && ACTIVE_STATUSES.includes(status),
    pollError: statusQuery.error,
    reset,
  };
}
