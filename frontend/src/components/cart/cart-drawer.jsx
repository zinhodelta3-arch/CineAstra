"use client"

import Link from "next/link"
import { ArrowRight, Minus, Plus, ShoppingCart, Ticket, Trash2 } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function CartDrawer({ open, onOpenChange }) {
  const { items, itemCount, total, updateQuantity, removeItem } = useCart()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-border/70 bg-card/60 p-5 pr-14 text-left">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[.24em] text-primary uppercase"><ShoppingCart className="size-3.5" /> CineAstra • Seu pedido</div>
            <SheetTitle className="text-2xl font-black">Meu carrinho <span className="text-primary">({itemCount})</span></SheetTitle>
            <SheetDescription>Ingressos e produtos do AstraSnack reunidos em um só lugar.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
                <div className="mb-4 grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><ShoppingCart className="size-6" /></div>
                <h3 className="font-bold">Seu carrinho está vazio</h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">Escolha seus ingressos ou um combo gostoso para começar.</p>
                <Button render={<Link href="/astrasnack" onClick={() => onOpenChange(false)} />} className="mt-4">Explorar AstraSnack</Button>
              </div>
            ) : items.map((item) => (
              <article key={item.type + item.id + item.details} className="flex gap-3 rounded-xl border border-border/70 bg-card/50 p-3">
                <div className="grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                  {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : item.type === "ticket" ? <Ticket className="size-7 text-primary" /> : <ShoppingCart className="size-7 text-primary/60" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-bold tracking-[.16em] text-primary uppercase">{item.category}</div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold">{item.name}</h3>
                  {item.details && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.details}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                      <Button variant="ghost" size="icon-xs" aria-label="Diminuir quantidade" onClick={() => updateQuantity(item.id, item.type, item.details, item.quantity - 1)}><Minus /></Button>
                      <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                      <Button variant="ghost" size="icon-xs" aria-label="Aumentar quantidade" onClick={() => updateQuantity(item.id, item.type, item.details, item.quantity + 1)}><Plus /></Button>
                    </div>
                    <strong className="text-sm">{money(item.price * item.quantity)}</strong>
                  </div>
                </div>
                <Button variant="ghost" size="icon-xs" className="self-start text-muted-foreground hover:text-destructive" aria-label={`Remover ${item.name}`} onClick={() => removeItem(item.id, item.type, item.details)}><Trash2 /></Button>
              </article>
            ))}
          </div>

          <div className="border-t border-border/70 bg-card/60 p-5">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground"><span>Itens no carrinho</span><span>{itemCount}</span></div>
            <div className="mb-4 flex items-center justify-between"><span className="font-semibold">Subtotal</span><strong className="text-xl font-black">{money(total)}</strong></div>
            <Button render={items.length > 0 ? <Link href="/carrinho" onClick={() => onOpenChange(false)} /> : undefined} className="mb-2 w-full" size="lg" disabled={items.length === 0}>Ver carrinho completo <ArrowRight className="size-4" /></Button>
            <p className="text-center text-[10px] text-muted-foreground">Você poderá revisar seu pedido antes de finalizar.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
