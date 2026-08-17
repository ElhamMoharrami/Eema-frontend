import type { UserRole } from "@/types/auth";

export function roleLabel(role: UserRole): string {
  return role === "SCOUT" ? "Scout" : role === "OWNER" ? "Venue owner" : "Admin";
}

export function roleHome(role: UserRole): string {
  return role === "SCOUT" ? "/scout/bookings" : role === "OWNER" ? "/owner/venues" : "/";
}
