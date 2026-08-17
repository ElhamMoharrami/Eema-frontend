export type UserRole = "SCOUT" | "OWNER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string | null;
  active: boolean;
  emailVerified: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  fullName: string;
  role: Exclude<UserRole, "ADMIN">;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
};
