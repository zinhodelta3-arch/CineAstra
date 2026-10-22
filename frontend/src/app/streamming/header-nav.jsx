"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ArrowUpRight, CircleHelp, Clapperboard, Film, LogOut, Menu, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AppearanceSelector } from "@/components/appearance-selector"

export const streamNavigation = [
  { label: "Filmes", href: "/streamming", icon: Film },
  { label: "Minha CineAstra", href: "/streamming/MeuAstra", icon: UserRound },
  { label: "Suporte", href: "/suporte-streaming", icon: CircleHelp },
]

/* Linha de destacar com entalhes semicirculares nas duas pontas */
function TearLine() {
  return (
    <div aria-hidden="true" className="relative border-t-2 border-dashed border-border/70">
      <span className="absolute top-0 -left-2.5 size-5 -translate-y-1/2 rounded-full border border-border/70 bg-background [clip-path:inset(0_0_0_50%)]" />
      <span className="absolute top-0 -right-2.5 size-5 -translate-y-1/2 rounded-full border border-border/70 bg-background [clip-path:inset(0_50%_0_0)]" />
    </div>
  )
}

function Barcode() {
  const bars = [2, 1, 3, 1, 2, 3, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2]
  return (
    <div aria-hidden="true" className="flex h-8 items-end gap-[2px] opacity-60">
      {bars.map((w, i) => (
        <span key={i} className="bg-foreground" style={{ width: w, height: `${65 + ((i * 11) % 35)}%` }} />
      ))}
    </div>
  )
}

function isActive(pathname, href) {
  if (href === "/streamming") return pathname === "/streamming"
  return pathname.startsWith(href)
}

function NavigationItems({ mobile = false, onNavigate }) {
  const pathname = usePathname()

  return (
    <div className={mobile ? "flex flex-col gap-1 py-4" : "flex items-center gap-1"}>
      {streamNavigation.map(({ label, href, icon: Icon }) => {
        const active = isActive(pathname, href)

        return (
          <Link
            key={label}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              mobile ? "rounded-lg" : "rounded-md"
            } ${
              active
                ? "border-x-2 border-dashed border-primary/50 bg-primary/10 font-semibold text-primary"
                : "border-x-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Icon className="size-4 opacity-70" aria-hidden="true" />
            <span>{label}</span>
            {mobile && <ArrowUpRight className="ml-auto size-4 opacity-40" aria-hidden="true" />}
          </Link>
        )
      })}
    </div>
  )
}

export function StreamDesktopNavigation() {
  return (
    <nav aria-label="Navegação do streaming" className="hidden md:flex">
      <NavigationItems />
    </nav>
  )
}

export function StreamMobileNavigation({ onSignOut }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu de navegação"
          />
        }
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent side="right" className="w-80 gap-0 p-4">
        {/* Ingresso */}
        <div className="flex h-full flex-col rounded-xl border border-border/70 bg-card/60">
          <SheetHeader className="p-5 pr-12 text-left">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
              <Clapperboard className="size-3" aria-hidden="true" />
              Now streaming
            </span>
            <SheetTitle className="text-xl font-black tracking-tight">
              CINEASTRA<span className="text-primary">.</span>
              <span className="ml-1.5 align-middle text-xs font-bold tracking-widest text-muted-foreground">STREAM</span>
            </SheetTitle>
          </SheetHeader>

          <TearLine />

          <nav aria-label="Navegação mobile" className="flex-1 overflow-y-auto px-3">
            <NavigationItems mobile onNavigate={() => setOpen(false)} />
            <div className="mt-2 border-t border-dashed border-border/70 pt-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onSignOut?.()
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sair da conta
              </button>
            </div>
          </nav>

          <TearLine />

          {/* Canhoto: tema + código de barras */}
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Tema do aplicativo</span>
              <AppearanceSelector />
            </div>
            <Barcode />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}