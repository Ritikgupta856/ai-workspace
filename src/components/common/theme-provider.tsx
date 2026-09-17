"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/** Toggles the `.dark` class on <html>; the design tokens in globals.css do the rest. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
