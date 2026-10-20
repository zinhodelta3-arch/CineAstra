"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, ShoppingCart, Ticket, Trash2 } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function CarrinhoPage() {
  const router = useRouter()
  const { items, itemCount, total, updateQuantity, removeItem } = useCart()

  return (
    <main className="min-h-[70vh] flex-1 bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex items-center gap-3 text-[10px] font-bold tracking-[.25em] text-primary uppercase"><ShoppingCart className="size-4" /> CineAstra • Meu pedido</div>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-xs font-semibold text-muted-foreground">SEU PEDIDO EM UM SÓ LUGAR</p><h1 className="f-display text-4xl font-black tracking-tight sm:text-5xl">Meu carrinho<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "itens"} adicionados</p></div>
          <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="size-4" /> Voltar</Button>
        </div>

        {items.length === 0 ? (
          <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center">
            <div className="max-w-sm"><div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><ShoppingBag className="size-7" /></div><h2 className="text-xl font-black">Ainda não há itens por aqui</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Adicione produtos do AstraSnack ao seu pedido. O carrinho também está preparado para receber ingressos.</p><Button render={<Link href="/astrasnack" />} className="mt-5">Explorar AstraSnack <ArrowRight className="size-4" /></Button></div>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-3">
              {items.map((item) => (
                <article key={item.type + item.id + item.details} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/40 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                    {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : item.type === "ticket" ? <Ticket className="size-8 text-primary" /> : <ShoppingBag className="size-8 text-primary/60" />}
                  </div>
                  <div className="min-w-0 flex-1"><div className="text-[10px] font-bold tracking-[.18em] text-primary uppercase">{item.category}</div><h2 className="mt-1 text-lg font-bold">{item.name}</h2>{item.description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p>}{item.details && <p className="mt-1 text-xs text-muted-foreground">{item.details}</p>}<p className="mt-2 text-sm font-semibold">{money(item.price)} <span className="font-normal text-muted-foreground">/ unidade</span></p></div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><div className="flex items-center gap-1 rounded-full border border-border p-1"><Button variant="ghost" size="icon-sm" aria-label="Diminuir quantidade" onClick={() => updateQuantity(item.id, item.type, item.details, item.quantity - 1)}><Minus /></Button><span className="w-6 text-center text-sm font-bold">{item.quantity}</span><Button variant="ghost" size="icon-sm" aria-label="Aumentar quantidade" onClick={() => updateQuantity(item.id, item.type, item.details, item.quantity + 1)}><Plus /></Button></div><strong className="text-lg font-black">{money(item.price * item.quantity)}</strong><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id, item.type, item.details)}><Trash2 className="size-4" /> Remover</Button></div>
                </article>
              ))}
              <div className="pt-3"><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="size-4" /> Voltar</Button></div>
            </section>

            <aside className="h-fit rounded-2xl border border-border/70 bg-card/60 p-5 lg:sticky lg:top-24">
              <div className="mb-4 text-[10px] font-bold tracking-[.2em] text-primary uppercase">Resumo do pedido</div><h2 className="text-xl font-black">Sua sessão, do seu jeito.</h2>
              <div className="my-5 space-y-3 border-y border-dashed border-border py-4 text-sm"><div className="flex justify-between text-muted-foreground"><span>Quantidade de itens</span><span>{itemCount}</span></div><div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(total)}</span></div><div className="flex justify-between text-muted-foreground"><span>Taxas</span><span>A calcular</span></div><div className="flex justify-between pt-1 text-base font-black"><span>Total parcial</span><span>{money(total)}</span></div></div>
              <Button className="w-full" size="lg" onClick={() => router.push("/pagamento")}><span>Finalizar compra</span><ArrowRight className="size-4" /></Button>
              <p className="mt-3 text-center text-[10px] leading-4 text-muted-foreground">Confira os itens antes de prosseguir para a próxima etapa.</p>
              <Button render={<Link href="/astrasnack" />} variant="outline" className="mt-3 w-full">Continuar comprando</Button>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
