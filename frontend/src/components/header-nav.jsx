"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ArrowUpRight, Film, House, MapPin, Menu, Popcorn, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader,
  SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import styles from "./header.module.css"

// Somente destinos publicados recebem href. Cadastre novas rotas aqui.
const navigation = [
  { label: "Início", href: "/", icon: House },
  { label: "Filmes", icon: Film },
  { label: "Cinemas", icon: MapPin },
  { label: "Bomboniere", icon: Popcorn },
  { label: "Experiências", icon: Sparkles },
]

function NavigationItems({ mobile = false, onNavigate }) {
  const pathname = usePathname()

  return navigation.map(({ label, href, icon: Icon }) => {
    const active = href && (href === "/" ? pathname === "/" : pathname.startsWith(href))
    const className = mobile ? styles.mobileLink : styles.navLink

    return href ? (
      <Link key={label} href={href} className={className}
        aria-current={active ? "page" : undefined} onClick={onNavigate}>
        {mobile && <Icon className="size-5" aria-hidden="true" />}
        {label}
        {mobile && <ArrowUpRight className="ml-auto size-4" aria-hidden="true" />}
      </Link>
    ) : (
      <span key={label} className={className} aria-disabled="true">
        {mobile && <Icon className="size-5" aria-hidden="true" />}
        {label}
        <span className={styles.soon}>Em breve</span>
      </span>
    )
  })
}

export function DesktopNavigation() {
  return <nav aria-label="Navegação principal" className={styles.navigation}>
    <NavigationItems />
  </nav>
}

export function MobileNavigation() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu de navegação" />}>
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="border-b px-6 py-7">
          <SheetTitle className="text-xl font-black tracking-tight">CINEASTRA<span className="text-primary">.</span></SheetTitle>
          <SheetDescription>Seu próximo grande momento.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navegação no celular" className="px-4">
          <NavigationItems mobile onNavigate={() => setOpen(false)} />
        </nav>
        <p className="mt-auto border-t px-6 py-6 text-xs leading-relaxed text-muted-foreground">
          A próxima cena começa aqui.
        </p>
      </SheetContent>
    </Sheet>
  )
}
