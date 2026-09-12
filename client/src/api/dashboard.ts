import { apiClient } from "./client";
import { isDemoMode } from "@/lib/demoMode";
import { demoStore } from "@/lib/demoStore";
import type { DashboardSummary } from "@/types";

export async function apiGetDashboard(month: number, year: number): Promise<DashboardSummary> {
  if (isDemoMode()) return demoStore.getDashboard(month, year);
  const { data } = await apiClient.get<{ summary: DashboardSummary }>("/dashboard", { params: { month, year } });
  return data.summary;
}
