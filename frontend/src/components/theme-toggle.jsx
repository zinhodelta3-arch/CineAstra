"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setTheme("light")}>
        Claro
      </Button>

      <Button variant="outline" onClick={() => setTheme("dark")}>
        Escuro
      </Button>

      <Button variant="outline" onClick={() => setTheme("themeClaude")}>
        Sistema
      </Button>
    </div>
  )
}