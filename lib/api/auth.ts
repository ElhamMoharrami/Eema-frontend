import { apiRequest } from "./client";
import type { AuthResponse, LoginRequest, MessageResponse, RefreshRequest, RegisterRequest, User } from "@/types/auth";

export const login = (request: LoginRequest) =>
  apiRequest<AuthResponse>("/auth/login", { method: "POST", body: request });

export const register = (request: RegisterRequest) =>
  apiRequest<AuthResponse>("/auth/register", { method: "POST", body: request });

export const refresh = (request: RefreshRequest) =>
  apiRequest<AuthResponse>("/auth/refresh", { method: "POST", body: request });

export const getCurrentUser = () =>
  apiRequest<User>("/auth/me", { auth: "required" });
export const verifyEmail = (token: string) => apiRequest<MessageResponse>("/auth/verify-email", { method: "POST", body: { token } });
export const resendVerification = (email: string) => apiRequest<MessageResponse>("/auth/resend-verification", { method: "POST", body: { email } });
export const forgotPassword = (email: string) => apiRequest<MessageResponse>("/auth/forgot-password", { method: "POST", body: { email } });
export const resetPassword = (token: string, newPassword: string) => apiRequest<MessageResponse>("/auth/reset-password", { method: "POST", body: { token, newPassword } });
