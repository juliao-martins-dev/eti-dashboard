"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useSesaun } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesaun = useSesaun();
  const router = useRouter();

  // SESAUN_BOOT already turns a logged-out visitor away on document load;
  // this covers logging out from the sidebar, where there is no reload.
  useEffect(() => {
    if (!sesaun) router.replace("/login");
  }, [sesaun, router]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="px-[26px] pt-[6px] pb-10">{children}</main>
      </div>
    </div>
  );
}
