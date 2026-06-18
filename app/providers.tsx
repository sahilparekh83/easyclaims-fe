"use client";

import React, { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-purple/theme.css";
import "primeicons/primeicons.css";
import { getQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/AuthStore";
import axios from "axios";
import { setAccessToken } from "@/lib/api-client";
import Cookies from "js-cookie";

function AuthRestorer() {
  const { setAuth, restoreFromCookie } = useAuthStore();

  useEffect(() => {
    const userType = Cookies.get("ec_user_type");
    const userId = Cookies.get("ec_user_id");
    const refreshToken = Cookies.get("ec_refresh_token");

    if (!userType || !refreshToken) return;

    // Silently refresh to get a fresh access token
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    axios
      .post(`${apiUrl}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
        withCredentials: true,
      })
      .then((res) => {
        const data = res.data?.data;
        if (data?.access_token) {
          setAccessToken(data.access_token);
          if (data.refresh_token && data.refresh_token !== "undefined") {
            Cookies.set("ec_refresh_token", data.refresh_token, { expires: 1, sameSite: "strict" });
          }
          useAuthStore.setState({
            accessToken: data.access_token,
            userType: userType as "SUPERADMIN" | "PARTNER" | "MEMBER",
            userId,
            isAuthenticated: true,
          });
        }
      })
      .catch(() => {
        Cookies.remove("ec_refresh_token");
        Cookies.remove("ec_user_type");
        Cookies.remove("ec_user_id");
      });
  }, [setAuth]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <AuthRestorer />
        {children}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      </PrimeReactProvider>
    </QueryClientProvider>
  );
}
