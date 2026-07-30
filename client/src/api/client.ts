import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

/** Vytiahne čitateľnú chybovú hlášku z backend odpovede (alebo vráti fallback). */
export function getApiErrorMessage(error: unknown, fallback = "Nastala chyba. Skús to prosím znova."): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ApiErrorBody>;
    return err.response?.data?.error ?? fallback;
  }
  return fallback;
}
