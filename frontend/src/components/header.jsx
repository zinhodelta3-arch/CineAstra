import Link from "next/link"
import { Aperture, Sparkles } from "lucide-react"
import { AppearanceSelector } from "@/components/appearance-selector"
import { DesktopNavigation, MobileNavigation } from "@/components/header-nav"
import styles from "./header.module.css"

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.topline} />
      <div className={styles.container}>
        <div className="flex min-h-20 items-center justify-between gap-3 md:min-h-24">
          <Link href="/" className={styles.brand} aria-label="CineAstra — página inicial">
            <span className={styles.brandMark}><Aperture className="size-7" strokeWidth={1.5} aria-hidden="true" /></span>
            <span>
              <span className="block text-xl leading-none font-black tracking-tighter sm:text-2xl">CINEASTRA<span className="text-primary">.</span></span>
              <span className="mt-1.5 hidden text-[9px] font-medium tracking-[0.23em] text-muted-foreground min-[380px]:block">MUITO ALÉM DA TELA</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <span className="hidden items-center gap-2 border-r pr-5 text-xs text-muted-foreground lg:flex">
            </span>
            <AppearanceSelector />
            <MobileNavigation />
          </div>
        </div>
        <div className="hidden items-center justify-between border-t border-border/60 md:flex">
          <DesktopNavigation />
          <span className="hidden text-[10px] tracking-[0.18em] text-muted-foreground xl:block">LUZ. CÂMERA. CINEASTRA.</span>
        </div>
      </div>
    </header>
  )
}
