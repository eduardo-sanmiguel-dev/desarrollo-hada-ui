import { usePathname } from "next/navigation";

import { useAuthStore } from "@/stores/auth.store";

const EMPTY_PERMISSIONS_MAP: Record<string, string[]> = {};
const EMPTY_ROUTE_PERMISSIONS: string[] = [];

const selectPermissionsMap = (
  state: ReturnType<typeof useAuthStore.getState>,
) => state.user?.permissions ?? EMPTY_PERMISSIONS_MAP;

export const usePermissionsByPath = (pathname: string) => {
  const permissions = useAuthStore(selectPermissionsMap);

  return {
    currentPermissions: permissions[pathname] ?? EMPTY_ROUTE_PERMISSIONS,
    permissions,
    enabledRoutes: Object.keys(permissions),
  };
};

export const usePermissions = () => {
  const pathname = usePathname();
  return usePermissionsByPath(pathname);
};
