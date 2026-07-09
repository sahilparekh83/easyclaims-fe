import { create } from "zustand";
import Cookies from "js-cookie";
import { setAccessToken } from "@/lib/api-client";

// Clear member partner context on logout (avoids stale partner cookie for next user)
function clearMemberCookies() {
  Cookies.remove("ec_active_partner");
  Cookies.remove("ec_active_partner_name");
}

interface AuthState {
  accessToken: string | null;
  userType: "SUPERADMIN" | "ADMIN" | "PARTNER" | "MEMBER" | null;
  userId: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  isSuperadmin: boolean;
  setAuth: (accessToken: string, refreshToken: string, userType: string, userId: string) => void;
  setPermissions: (permissions: string[], isSuperadmin: boolean) => void;
  hasPermission: (module: string, action?: string) => boolean;
  clearAuth: () => void;
  restoreFromCookie: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  userType: null,
  userId: null,
  isAuthenticated: false,
  permissions: [],
  isSuperadmin: false,

  setAuth: (accessToken, refreshToken, userType, userId) => {
    setAccessToken(accessToken);
    Cookies.set("ec_refresh_token", refreshToken, { expires: 1, sameSite: "strict" });
    Cookies.set("ec_user_type", userType, { expires: 1, sameSite: "strict" });
    Cookies.set("ec_user_id", userId, { expires: 1, sameSite: "strict" });
    set({ accessToken, userType: userType as AuthState["userType"], userId, isAuthenticated: true });
  },

  setPermissions: (permissions, isSuperadmin) => set({ permissions, isSuperadmin }),

  // Menus/buttons check this — e.g. hasPermission("partners") for "can see this at all",
  // hasPermission("partners", "edit") for a specific action. SUPERADMIN always passes.
  hasPermission: (module, action = "view") => {
    const { permissions, isSuperadmin } = get();
    if (isSuperadmin) return true;
    return permissions.includes(`${module}:${action}`);
  },

  clearAuth: () => {
    setAccessToken(null);
    Cookies.remove("ec_refresh_token");
    Cookies.remove("ec_user_type");
    Cookies.remove("ec_user_id");
    clearMemberCookies();
    set({ accessToken: null, userType: null, userId: null, isAuthenticated: false, permissions: [], isSuperadmin: false });
  },

  restoreFromCookie: () => {
    const userType = Cookies.get("ec_user_type");
    const userId = Cookies.get("ec_user_id") || "";
    if (userType) {
      set({ userType: userType as AuthState["userType"], userId, isAuthenticated: true });
      return true;
    }
    return false;
  },
}));
