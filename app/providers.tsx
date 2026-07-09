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

// Restores userType/userId/isAuthenticated from cookies synchronously on app boot.
// Does NOT fetch a fresh access token itself — apiClient's response interceptor
// already does that (with proper single-flight/queueing) the moment the first
// real request 401s because the in-memory access token is empty after a reload.
// A second, independent refresh call here used to race that interceptor for the
// same single-use refresh token — whichever lost got "session expired", which is
// why the menu (and anything else needing a fresh token) intermittently vanished
// after a hard refresh.
function AuthRestorer() {
  const { restoreFromCookie } = useAuthStore();

  useEffect(() => {
    restoreFromCookie();
  }, [restoreFromCookie]);

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
