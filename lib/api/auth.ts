import { apiRequest } from "./client";
import type { AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, User } from "@/types/auth";

export const login = (request: LoginRequest) =>
  apiRequest<AuthResponse>("/auth/login", { method: "POST", body: request });

export const register = (request: RegisterRequest) =>
  apiRequest<AuthResponse>("/auth/register", { method: "POST", body: request });

export const refresh = (request: RefreshRequest) =>
  apiRequest<AuthResponse>("/auth/refresh", { method: "POST", body: request });

export const getCurrentUser = () =>
  apiRequest<User>("/auth/me", { auth: "required" });
