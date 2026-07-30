import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types";

// In dev, /api goes through the Vite proxy to localhost:4000 (same origin).
// In production the frontend and backend run on different domains, hence the absolute URL from an env var.
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

/** Extracts a readable error message from the backend response (or returns a fallback). */
export function getApiErrorMessage(error: unknown, fallback = "Nastala chyba. Skús to prosím znova."): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ApiErrorBody>;
    return err.response?.data?.error ?? fallback;
  }
  return fallback;
}
