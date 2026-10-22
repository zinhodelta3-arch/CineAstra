"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Search } from "lucide-react";
import { AppearanceSelector } from "@/components/appearance-selector";
import { NotificationButton } from "@/components/notifications/notification-button";
import { StreamDesktopNavigation, StreamMobileNavigation } from "@/components/stream-header-nav";

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
];

const DEFAULT_LOGO = "/CineAstras.png";

/**
 * Resolve o caminho da logo baseado no valor do atributo data-theme do <html>
 */
function getLogoByTheme(theme) {
  if (!theme) return DEFAULT_LOGO;
  const normalizedTheme = theme.toLowerCase();
  for (const config of LOGO_CONFIG) {
    if (config.keywords.some((keyword) => normalizedTheme.includes(keyword))) return config.src;
  }
  return DEFAULT_LOGO;
}

function Perforation({ className = "" }) {
  return <span aria-hidden="true" className={`pointer-events-none absolute inset-x-8 h-px text-border bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)] ${className}`} />;
}

function Notch({ side }) {
  return <span aria-hidden="true" className={`pointer-events-none absolute top-1/2 z-10 size-5 -translate-y-1/2 rounded-full border border-border/70 bg-background ${side === "left" ? "-left-2.5 [clip-path:inset(0_0_0_50%)]" : "-right-2.5 [clip-path:inset(0_50%_0_0)]"}`} />;
}

function Barcode() {
  const bars = [2, 1, 3, 1, 2, 3, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3];
  return <div aria-hidden="true" className="hidden h-7 items-end gap-[2px] opacity-60 2xl:flex">{bars.map((w, i) => <span key={i} className="bg-foreground" style={{ width: w, height: `${65 + ((i * 11) % 35)}%` }} />)}</div>;
}

/**
 * Header do streaming.
 * `onSignOut`: função chamada ao clicar em "Sair da conta" (ligue ao seu logout).
 */
export function StreamHeader({ onSignOut }) {
  const pathname = usePathname();
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO);

  useEffect(() => {
    const updateLogo = () => setLogoSrc(getLogoByTheme(document.documentElement.getAttribute("data-theme")));
    updateLogo();
    const observer = new MutationObserver(updateLogo);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return <header className="sticky top-0 z-50 h-[81px] w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
    <div className="container mx-auto flex h-full max-w-[88rem] items-center px-3 py-2 sm:px-4">
      <div className="relative flex h-[65px] w-full items-stretch rounded-lg border border-border/70 bg-card/60 shadow-sm">
        <Notch side="left" /><Notch side="right" /><Perforation className="top-[3px]" /><Perforation className="bottom-[3px]" />
        <Link href="/streamming" className="group flex min-w-0 shrink items-center gap-2 border-r-2 border-dashed border-border/70 px-3 transition-opacity hover:opacity-90 sm:shrink-0 sm:px-5 lg:px-7" aria-label="CineAstra Stream — Página inicial">
          <div className="flex h-9 min-w-0 items-center justify-center sm:h-10"><img src={logoSrc} alt="CineAstra Logo" className="h-auto max-h-full w-auto max-w-[105px] object-contain object-center transition-transform duration-300 group-hover:scale-105 sm:max-w-[150px] lg:max-w-[180px]" /></div>
          <span className="hidden -rotate-3 rounded border border-dashed border-primary/50 bg-primary/10 px-1.5 py-0.5 text-[10px] font-black tracking-widest text-primary uppercase lg:inline-block">Stream</span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-center px-0 sm:px-2 lg:px-4 xl:px-6"><StreamDesktopNavigation /></div>
        <div className="flex shrink-0 items-center gap-3 border-l-2 border-dashed border-border/70 pl-2 pr-3 sm:pl-4 sm:pr-5 lg:pl-6 lg:pr-6">
          <Barcode />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/streamming/busca" aria-label="Buscar filmes" title="Buscar filmes" aria-current={pathname === "/streamming/busca" ? "page" : undefined} className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-ring ${pathname === "/streamming/busca" ? "border-primary/50 bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Search className="size-5" aria-hidden="true" /></Link>
            <NotificationButton />
            <div className="hidden sm:block"><AppearanceSelector /></div>
            <button
              type="button"
              onClick={() => onSignOut?.()}
              aria-label="Sair da conta"
              title="Sair da conta"
              className="hidden h-9 items-center gap-2 rounded-md border border-border/70 px-3 text-xs font-semibold text-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring xl:inline-flex"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden lg:inline">Sair</span>
            </button>
            <StreamMobileNavigation onSignOut={onSignOut} />
          </div>
        </div>
      </div>
    </div>
  </header>;
}