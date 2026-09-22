import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/common/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Display serif for the agent greeting; Instrument Serif ships a single weight.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Synapse — AI Workspace for Modern Teams",
    template: "%s | Synapse",
  },
  description:
    "Synapse is an AI-powered workspace that brings together projects, chats, documents, tasks, knowledge, and integrations in one intelligent platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", inter.variable, instrumentSerif.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
