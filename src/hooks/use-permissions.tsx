import { usePathname } from "next/navigation";

import { useAuthStore } from "@/stores/auth.store";

export const usePermissions = () => {
  const permissions = useAuthStore((state) => state.user?.permissions || {});
  const pathname = usePathname();

  return permissions[pathname] || [];
};
