import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UltraAgent — Do the work. Show the work. Stay in control.",
    template: "%s · UltraAgent",
  },
  description:
    "UltraAgent is the AI agent that does the daily work of an office — email, calendar, documents, reports, meetings and approvals — across the tools your team already uses.",
  keywords: [
    "AI agent",
    "office automation",
    "inbox triage",
    "calendar scheduling",
    "approvals",
    "audit log",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <StoreProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </StoreProvider>
      </body>
    </html>
  );
}
