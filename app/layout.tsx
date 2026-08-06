import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import { ApiFallback } from "@/components/ApiFallback";
import { ToastProvider } from "@/components/ui/Toast";
import { SESAUN_BOOT } from "@/lib/auth";
import { THEME_BOOT } from "@/lib/theme";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  // Needed to turn the relative OG image into an absolute URL. Override with
  // NEXT_PUBLIC_SITE_URL when this is served somewhere other than a dev box.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ETI PREZENSA · Admin",
  description: "Painel administrasaun prezensa ba profesór/a ETI Dili.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/icon.png" }],
  },
  openGraph: {
    title: "ETI PREZENSA · Admin",
    description: "Painel administrasaun prezensa ba profesór/a ETI Dili.",
    images: [{ url: "/eti.jpg", width: 200, height: 200 }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `data-mode` is the switch Konfigurasaun flips. The two boot scripts
    // rewrite it (and redirect the logged out) before hydration, which is what
    // suppressHydrationWarning is covering here.
    <html
      lang="tet"
      data-mode="light"
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: SESAUN_BOOT }} />
        <ToastProvider>
          {children}
          {/* Above the routes, so a dead network is caught on /login too. */}
          <ApiFallback />
        </ToastProvider>
      </body>
    </html>
  );
}