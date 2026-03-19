import { usePathname } from "next/navigation";

import { useAuthStore } from "@/stores/auth.store";
import type { UserPermissions } from "@/stores/auth.store";

const EMPTY_PERMISSIONS_MAP: UserPermissions = {};
const EMPTY_ROUTE_PERMISSIONS: string[] = [];

const normalizeRoute = (route: string) => route.replace(/\/+$/, "") || "/";

const isPermissionGroup = (
  value: unknown,
): value is Array<Record<string, unknown>> =>
  Array.isArray(value) &&
  value.length > 0 &&
  typeof value[0] === "object" &&
  value[0] !== null;

const buildEnabledRoutes = (permissions: UserPermissions): string[] => {
  const enabledRoutes = new Set<string>();

  for (const [route, permissionValue] of Object.entries(permissions)) {
    const baseRoute = normalizeRoute(route);
    enabledRoutes.add(baseRoute);

    if (!isPermissionGroup(permissionValue)) {
      continue;
    }

    for (const group of permissionValue) {
      for (const subRoute of Object.keys(group)) {
        enabledRoutes.add(`${baseRoute}/${subRoute.replace(/^\/+/, "")}`);
      }
    }
  }

  return Array.from(enabledRoutes);
};

const selectPermissionsMap = (
  state: ReturnType<typeof useAuthStore.getState>,
) => state.user?.permissions ?? EMPTY_PERMISSIONS_MAP;

export const usePermissionsByPath = (pathname: string) => {
  const permissions = useAuthStore(selectPermissionsMap);
  const enabledRoutes = buildEnabledRoutes(permissions);

  return {
    currentPermissions:
      (permissions[normalizeRoute(pathname)] as string[] | undefined) ??
      EMPTY_ROUTE_PERMISSIONS,
    permissions,
    enabledRoutes,
  };
};

export const usePermissions = () => {
  const pathname = usePathname();
  return usePermissionsByPath(pathname);
};
