import { create } from "zustand";

export type PermissionTree =
  | string[]
  | Array<Record<string, string[] | Record<string, string[]>[]>>;

export type UserPermissions = Record<string, PermissionTree>;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  permissions: UserPermissions;
};

type AuthStoreState = {
  user: SessionUser | null;
  userId: number | null;
  isSessionReady: boolean;
  setSession: (payload: { userId: number; user: SessionUser }) => void;
  clearSession: () => void;
  setSessionReady: (value: boolean) => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  userId: null,
  isSessionReady: false,
  setSession: ({ userId, user }) => {
    set({ userId, user, isSessionReady: true });
  },
  clearSession: () => {
    set({ user: null, userId: null, isSessionReady: true });
  },
  setSessionReady: (value) => {
    set({ isSessionReady: value });
  },
}));
