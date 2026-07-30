import { apiClient } from "./client";
import type { DashboardSummary } from "@/types";

export async function apiGetDashboard(month: number, year: number): Promise<DashboardSummary> {
  const { data } = await apiClient.get<{ summary: DashboardSummary }>("/dashboard", { params: { month, year } });
  return data.summary;
}
