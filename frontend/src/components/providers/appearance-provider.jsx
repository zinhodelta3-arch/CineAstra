"use client"

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react"
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  isAppearance,
} from "@/lib/themes"

const AppearanceContext = createContext(null)
const APPEARANCE_CHANGE_EVENT = "cineastra-appearance-change"

function getAppearanceSnapshot() {
  const currentAppearance = document.documentElement.dataset.theme
  return isAppearance(currentAppearance) ? currentAppearance : DEFAULT_APPEARANCE
}

function subscribeToAppearance(callback) {
  const handleStorage = (event) => {
    if (event.key !== APPEARANCE_STORAGE_KEY) return

    const nextAppearance = isAppearance(event.newValue)
      ? event.newValue
      : DEFAULT_APPEARANCE
    document.documentElement.dataset.theme = nextAppearance
    callback()
  }

  window.addEventListener(APPEARANCE_CHANGE_EVENT, callback)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(APPEARANCE_CHANGE_EVENT, callback)
    window.removeEventListener("storage", handleStorage)
  }
}

export function AppearanceProvider({ children }) {
  const appearance = useSyncExternalStore(
    subscribeToAppearance,
    getAppearanceSnapshot,
    () => DEFAULT_APPEARANCE
  )

  const setAppearance = useCallback((nextAppearance) => {
    if (!isAppearance(nextAppearance)) return

    document.documentElement.dataset.theme = nextAppearance

    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, nextAppearance)
    } catch {
      // A troca continua funcionando quando o navegador bloqueia o armazenamento.
    }

    window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT))
  }, [])

  const value = useMemo(
    () => ({ appearance, setAppearance }),
    [appearance, setAppearance]
  )

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const context = useContext(AppearanceContext)

  if (!context) {
    throw new Error("useAppearance deve ser usado dentro de AppearanceProvider")
  }

  return context
}
