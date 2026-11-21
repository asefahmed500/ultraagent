import type { AutonomyLevel, Role } from "@/lib/constants";

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  member: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

const AUTONOMY_RANK: Record<AutonomyLevel, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
};

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function autonomyAtMost(
  requested: AutonomyLevel,
  ceiling: AutonomyLevel
): boolean {
  return AUTONOMY_RANK[requested] <= AUTONOMY_RANK[ceiling];
}

export function maxAutonomy(
  a: AutonomyLevel,
  b: AutonomyLevel
): AutonomyLevel {
  return AUTONOMY_RANK[a] >= AUTONOMY_RANK[b] ? a : b;
}

export function minAutonomy(
  a: AutonomyLevel,
  b: AutonomyLevel
): AutonomyLevel {
  return AUTONOMY_RANK[a] <= AUTONOMY_RANK[b] ? a : b;
}

export function canManageWorkspace(role: Role): boolean {
  return roleAtLeast(role, "admin");
}

export function canViewAudit(role: Role): boolean {
  return roleAtLeast(role, "manager");
}

export function canDecideApprovals(role: Role): boolean {
  return roleAtLeast(role, "manager");
}

export function canManagePolicies(role: Role): boolean {
  return roleAtLeast(role, "admin");
}
