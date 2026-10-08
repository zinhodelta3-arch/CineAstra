"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AppearanceSelector } from "@/components/appearance-selector"
import { DesktopNavigation, MobileNavigation } from "@/components/header-nav"

// Mapeamento ordenado dos temas para as logos correspondentes na pasta public
const LOGO_CONFIG = [
  {
    keywords: ["catp", "catppuccin", "latte", "frappe", "macchiato"],
    src: "/Catp.png",
  },
  {
    keywords: ["mocha"],
    src: "/Mocha.png",
  },
  {
    keywords: ["violet"],
    src: "/Violet.png",
  },
]

const DEFAULT_LOGO = "/CineAstralogou.png"

/**
 * Resolve o caminho da logo baseado no valor do atributo data-theme do <html>
 */
function getLogoByTheme(theme) {
  if (!theme) return DEFAULT_LOGO
  const normalizedTheme = theme.toLowerCase()

  for (const config of LOGO_CONFIG) {
    if (config.keywords.some((keyword) => normalizedTheme.includes(keyword))) {
      return config.src
    }
  }

  return DEFAULT_LOGO
}

/* Picote: linha pontilhada que imita a borda serrilhada do ingresso */
function Perforation({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-8 h-px text-border bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)] ${className}`}
    />
  )
}

/* Entalhe semicircular nas laterais, como o furo do ingresso */
function Notch({ side }) {
  const left = side === "left"
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 z-10 size-5 -translate-y-1/2 rounded-full border border-border/70 bg-background ${
        left
          ? "-left-2.5 [clip-path:inset(0_0_0_50%)]"
          : "-right-2.5 [clip-path:inset(0_50%_0_0)]"
      }`}
    />
  )
}

/* Código de barras decorativo do canhoto */
function Barcode() {
  const bars = [2, 1, 3, 1, 2, 3, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3]
  return (
    <div aria-hidden="true" className="hidden h-7 items-end gap-[2px] opacity-60 lg:flex">
      {bars.map((w, i) => (
        <span
          key={i}
          className="bg-foreground"
          style={{ width: w, height: `${65 + ((i * 11) % 35)}%` }}
        />
      ))}
    </div>
  )
}

export function Header() {
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO)

  useEffect(() => {
    const updateLogo = () => {
      const activeTheme = document.documentElement.getAttribute("data-theme")
      setLogoSrc(getLogoByTheme(activeTheme))
    }

    updateLogo()

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          updateLogo()
          break
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <header className="sticky top-0 z-50 h-[81px] w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-full max-w-[88rem] items-center px-3 py-2 sm:px-4">
        {/* Ingresso */}
        <div className="relative flex h-[65px] w-full items-stretch rounded-lg border border-border/70 bg-card/60 shadow-sm">
          <Notch side="left" />
          <Notch side="right" />
          <Perforation className="top-[3px]" />
          <Perforation className="bottom-[3px]" />

          {/* Seção da Logo: Espaçamento fluido com a linha tracejada perfeitamente alinhada */}
          <Link
            href="/"
            className="group flex shrink-0 items-center border-r-2 border-dashed border-border/70 px-5 transition-opacity hover:opacity-90 sm:px-7"
            aria-label="CineAstra — Página inicial"
          >
            <div className="flex h-9 w-auto items-center justify-center sm:h-10">
              <img
                src={logoSrc}
                alt="CineAstra Logo"
                className="h-full w-auto max-w-[150px] object-contain object-center transition-transform duration-300 group-hover:scale-105 sm:max-w-[180px]"
              />
            </div>
          </Link>

          {/* Corpo do ingresso: navegação */}
          <div className="flex flex-1 min-w-0 items-center justify-center px-4 sm:px-6">
            <DesktopNavigation />
          </div>

          {/* Canhoto destacável: ações */}
          <div className="flex shrink-0 items-center gap-3 border-l-2 border-dashed border-border/70 pl-4 pr-5 sm:pl-6 sm:pr-6">
            <Barcode />
            <div className="flex items-center gap-2">
              <AppearanceSelector />
              <MobileNavigation />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}