"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AppearanceProvider } from "@/components/providers/appearance-provider"

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="cineastra-mode"
      disableTransitionOnChange
    >
      <AppearanceProvider>{children}</AppearanceProvider>
    </NextThemesProvider>
  )
}
