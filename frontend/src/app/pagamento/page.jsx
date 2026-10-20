"use client"

import Link from "next/link"
import { ArrowLeft, CreditCard, ShieldCheck, Ticket } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function PagamentoPage() {
  const { items, itemCount, total } = useCart()

  return (
    <main className="min-h-[70vh] flex-1 bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[.24em] text-primary uppercase"><CreditCard className="size-4" /> CineAstra • Finalização</div>
        <h1 className="f-display text-4xl font-black tracking-tight sm:text-5xl">Finalizar compra<span className="text-primary">.</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Confira o resumo do seu pedido. A integração com um meio de pagamento será adicionada em uma próxima etapa.</p>

        <section className="mt-8 rounded-2xl border border-border/70 bg-card/50 p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-dashed border-border pb-4"><div><h2 className="text-xl font-black">Resumo do pedido</h2><p className="mt-1 text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "itens"}</p></div><ShieldCheck className="size-6 text-primary" /></div>
          {items.length === 0 ? (
            <div className="py-8 text-center"><Ticket className="mx-auto mb-3 size-8 text-primary" /><h3 className="font-bold">Seu carrinho está vazio</h3><p className="mt-1 text-sm text-muted-foreground">Adicione ingressos ou produtos antes de continuar.</p><Button render={<Link href="/carrinho" />} className="mt-4">Voltar ao carrinho</Button></div>
          ) : (
            <>
              <div className="space-y-4">{items.map((item) => <div key={item.type + item.id + item.details} className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-semibold">{item.name} <span className="text-sm font-normal text-muted-foreground">× {item.quantity}</span></p><p className="mt-1 text-xs text-muted-foreground">{item.description}{item.details ? ` • ${item.details}` : ""}</p></div><strong className="shrink-0">{money(item.price * item.quantity)}</strong></div>)}</div>
              <div className="mt-6 flex items-center justify-between border-t border-dashed border-border pt-5"><span className="font-semibold">Total parcial</span><strong className="text-2xl font-black">{money(total)}</strong></div>
              <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-4 text-sm leading-6 text-muted-foreground">Esta é uma etapa visual do projeto. Nenhuma cobrança será realizada nesta página ainda.</div>
            </>
          )}
        </section>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button render={<Link href="/carrinho" />} variant="outline"><ArrowLeft className="size-4" /> Voltar ao carrinho</Button><Button render={<Link href="/astrasnack" />} variant="ghost">Continuar comprando</Button></div>
      </div>
    </main>
  )
}
