"use client"

import { useSyncExternalStore } from "react"
import { Monitor, Moon, Palette, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useAppearance } from "@/components/providers/appearance-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { appearances } from "@/lib/themes"

const modes = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
]

const emptySubscribe = () => () => {}

export function AppearanceSelector() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const { theme = "system", setTheme } = useTheme()
  const { appearance, setAppearance } = useAppearance()

  const selectedMode = mounted ? theme : "system"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Abrir configurações de aparência"
          />
        }
      >
        <Palette aria-hidden="true" />
        <span className="hidden sm:inline"></span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuRadioGroup value={selectedMode} onValueChange={setTheme}>
          <DropdownMenuLabel>Modo</DropdownMenuLabel>
          {modes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={appearance} onValueChange={setAppearance}>
          <DropdownMenuLabel>Tema visual</DropdownMenuLabel>
          {appearances.map(({ value, label, description, preview }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <span className="flex -space-x-1" aria-hidden="true">
                {preview.map((color) => (
                  <span
                    key={color}
                    className="size-3 rounded-full border border-background"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="flex flex-col">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
