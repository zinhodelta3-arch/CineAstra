"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import {
  AppearanceProvider,
  useAppearance,
} from "@/components/providers/appearance-provider"
import { isNoirAppearance } from "@/lib/themes"

function ModeProvider({ children }) {
  const { appearance } = useAppearance()

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="cineastra-mode"
      disableTransitionOnChange
      forcedTheme={isNoirAppearance(appearance) ? "dark" : undefined}
    >
      {children}
    </NextThemesProvider>
  )
}

export function ThemeProvider({ children }) {
  return (
    <AppearanceProvider>
      <ModeProvider>{children}</ModeProvider>
    </AppearanceProvider>
  )
}
