import { apiClient } from "./client";
import type { User } from "@/types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function apiRegister(payload: RegisterPayload): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>("/auth/register", payload);
  return data.user;
}

export async function apiLogin(payload: LoginPayload): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>("/auth/login", payload);
  return data.user;
}

export async function apiLogout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function apiFetchMe(): Promise<User> {
  const { data } = await apiClient.get<{ user: User }>("/auth/me");
  return data.user;
}
