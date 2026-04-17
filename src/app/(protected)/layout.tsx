"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token       = useAuthStore((s) => s.token);
  const accountMode = useAuthStore((s) => s.accountMode);
  const queryClient = useQueryClient();
  const prevMode    = useRef(accountMode);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  // When account mode changes, invalidate ALL cached queries so every page
  // re-fetches with the new X-Account-Mode header automatically.
  useEffect(() => {
    if (prevMode.current !== accountMode) {
      prevMode.current = accountMode;
      queryClient.invalidateQueries();
    }
  }, [accountMode, queryClient]);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#060D18]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#060D18]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
