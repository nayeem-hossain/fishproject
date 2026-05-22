export type Role = "ADMIN" | "OPERATOR";
export type Resource = "dashboard" | "projects" | "documents" | "inventory" | "feed" | "users";
export type Action = "view" | "create" | "update" | "delete";

const permissions: Record<Role, Record<Resource, Action[]>> = {
  ADMIN: {
    dashboard: ["view"],
    projects: ["view", "create", "update", "delete"],
    documents: ["view", "create", "update", "delete"],
    inventory: ["view", "create", "update", "delete"],
    feed: ["view", "create", "update", "delete"],
    users: ["view", "create", "update", "delete"]
  },
  OPERATOR: {
    dashboard: ["view"],
    projects: ["view", "update"],
    documents: ["view", "update"],
    inventory: ["view", "create", "update"],
    feed: ["view", "create", "update"],
    users: []
  }
};

export function can(role: Role, resource: Resource, action: Action) {
  return permissions[role][resource].includes(action);
}

export function canAccessPath(role: Role, pathname: string) {
  if (pathname.startsWith("/users")) {
    return role === "ADMIN";
  }

  return true;
}

export function isDashboardOperatorView(role: Role) {
  return role === "OPERATOR";
}