import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types";

// V deve ide /api cez Vite proxy na localhost:4000 (rovnaký origin).
// V produkcii beží frontend a backend na rôznych doménach, preto absolútna URL z env premennej.
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

export const apiClient = axios.create({
  baseURL,
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
