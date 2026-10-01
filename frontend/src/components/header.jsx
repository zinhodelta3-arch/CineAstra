import Link from "next/link"
import { AppearanceSelector } from "@/components/appearance-selector"
import { DesktopNavigation, MobileNavigation } from "@/components/header-nav"

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
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <div className="container mx-auto max-w-[88rem] px-3 py-2 sm:px-">
        {/* Ingresso */}
        <div className="relative flex h-[65px] items-stretch rounded-lg border border-border/70 bg-card/60 shadow-sm">
          <Notch side="left" />
          <Notch side="right" />
          <Perforation className="top-[3px]" />
          <Perforation className="bottom-[3px]" />

         <Link
         href="/"
         className="group flex flex-col items-start justify-center gap-1 border-r-2 border-dashed border-border/70 pl-3 pr-3 transition-opacity hover:opacity-90 sm:pl-4 sm:pr-4"
         aria-label="CineAstra — Página inicial"
         >
         <img
         src="/CineAstra.png"
          alt=""
           aria-hidden="true"
            className="h-10 w-auto max-w-[180px] object-contain transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:max-w-[200px]"
           />
          </Link>

          {/* Corpo do ingresso: navegação */}
          <div className="flex flex-1 items-center justify-center px-3 sm:px-4">
            <DesktopNavigation />
          </div>

          {/* Canhoto destacável: ações */}
          <div className="flex items-center gap-3 border-l-2 border-dashed border-border/70 pl-3 pr-5 sm:pl-4 sm:pr-6">
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