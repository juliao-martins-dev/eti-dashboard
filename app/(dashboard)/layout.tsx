"use client";

import { useEffect, useState } from "react";
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
  // The drawer state lives here because the button that opens it is in the
  // topbar and the drawer it opens is the sidebar, siblings either way.
  const [menu, setMenu] = useState(false);

  // Only an explicit null means signed out. `undefined` is the hydration
  // render, which has no localStorage to read — treating that as signed out
  // sent a refresh bouncing through /login and straight back here.
  //
  // SESAUN_BOOT has already turned away anyone without a token before paint,
  // so this is really here for signing out from the sidebar and for a refresh
  // token that expired mid-session, neither of which reloads the document.
  useEffect(() => {
    if (sesaun === null) router.replace("/login");
  }, [sesaun, router]);

  return (
    <div className="flex min-h-screen">
      <Sidebar abertu={menu} onClose={() => setMenu(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMenu(true)} />
        <main className="px-[26px] pt-[6px] pb-10">{children}</main>
      </div>
    </div>
  );
}
