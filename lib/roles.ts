export const ROLE = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  TRAINER: "TRAINER",
  MEMBER: "MEMBER",
} as const;

export type AppRole = (typeof ROLE)[keyof typeof ROLE];

export const DASHBOARD_ROLES: AppRole[] = [ROLE.ADMIN, ROLE.STAFF, ROLE.TRAINER];
