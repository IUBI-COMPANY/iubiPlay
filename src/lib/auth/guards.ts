import type { Role } from "./roles";

export function hasRole(userRole: Role, required: Role) {
  return userRole === required;
}
