import { apiClient } from "./client";
import { isDemoMode } from "@/lib/demoMode";
import { demoStore } from "@/lib/demoStore";
import type { StatementImport } from "@/types";

/**
 * Uploads a statement for background processing. In demo mode there is no backend,
 * so the bundled sample statement is "imported" instead and `file` is ignored.
 */
export async function apiStartImport(accountId: string, file: File | null): Promise<StatementImport> {
  if (isDemoMode()) return demoStore.startSampleImport(accountId);
  if (!file) throw new Error("Vyber súbor s výpisom.");
  const { data } = await apiClient.post<{ import: StatementImport }>("/imports", file, {
    params: { accountId, fileName: file.name },
    headers: { "Content-Type": "text/csv" },
  });
  return data.import;
}

export async function apiGetImport(id: string): Promise<StatementImport> {
  if (isDemoMode()) return demoStore.getImport(id);
  const { data } = await apiClient.get<{ import: StatementImport }>(`/imports/${id}`);
  return data.import;
}
