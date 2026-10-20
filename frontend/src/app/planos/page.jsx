"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight, Check, CheckCircle2, ChevronDown, CircleHelp, Clapperboard,
  CreditCard, Crown, Gift, Heart, ShieldCheck, Sparkles, Ticket, Users, Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const PLANS = [
  {
    id: "essencial", name: "Astra Essencial", tagline: "Para quem ama cinema e quer começar.", monthly: 19.90, annual: 199.00,
    icon: Ticket, accent: false, badge: "Para começar",
    benefits: [
      "Acesso ao catálogo de streaming",
      "1 ingresso de cinema grátis por mês",
      "10% de desconto em combos AstraSnack",
      "2 cupons de desconto por mês",
      "Aluguel avulso de títulos premium",
      "Compartilhamento com até 1 participante",
    ],
  },
  {
    id: "plus", name: "Astra Plus", tagline: "Mais vantagens para curtir todo mês.", monthly: 39.90, annual: 399.00,
    icon: Sparkles, accent: true, badge: "Mais escolhido",
    benefits: [
      "Todo o streaming incluído, sem anúncios",
      "2 ingressos de cinema grátis por mês",
      "1 combo médio grátis por mês",
      "20% de desconto em combos AstraSnack",
      "4 cupons de desconto por mês",
      "Compartilhamento com até 3 participantes",
    ],
  },
  {
    id: "max", name: "Astra Max", tagline: "A experiência completa, para dividir.", monthly: 69.90, annual: 699.00,
    icon: Crown, accent: false, badge: "Experiência completa",
    benefits: [
      "Todo o streaming incluído, sem anúncios",
      "4 ingressos de cinema grátis por mês, válidos para sessões de qualquer tipo, incluindo 3D e outras modalidades disponíveis",
      "1 combo médio grátis por mês",
      "30% de desconto em combos AstraSnack",
      "Cupons exclusivos e ofertas antecipadas",
      "Compartilhamento com até 5 participantes",
    ],
  },
]

const money = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function PlanosPage() {
  const [billing, setBilling] = useState("monthly")
  const [selected, setSelected] = useState("plus")
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePlan, setSharePlan] = useState("plus")
  const [paymentSplit, setPaymentSplit] = useState("titular")
  const [inviteContact, setInviteContact] = useState("")
  const [inviteSent, setInviteSent] = useState(false)
  const [faqOpen, setFaqOpen] = useState(0)
  const [checkoutNotice, setCheckoutNotice] = useState(false)

  const priceFor = (plan) => billing === "monthly" ? plan.monthly : plan.annual
  const periodFor = billing === "monthly" ? "/mês" : "/ano"
  const annualSavings = (plan) => Math.round((plan.monthly * 12 - plan.annual) * 100) / 100

  const startSubscription = (id) => {
    setSelected(id)
    setCheckoutNotice(true)
    document.getElementById("assinar")?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const submitInvite = (event) => {
    event.preventDefault()
    setInviteSent(true)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_75%_20%,hsl(var(--primary)/.22),transparent_50%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--card)))]" />
        <div className="absolute -right-24 top-12 -z-10 size-80 rounded-full border border-primary/20 md:size-[30rem]" />
        <div className="absolute -right-10 top-24 -z-10 size-60 rounded-full border border-dashed border-primary/30 md:size-[24rem]" />
        <div className="mx-auto grid min-h-[500px] max-w-[1600px] items-center gap-10 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:px-10 md:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black tracking-[.3em] text-primary uppercase"><Sparkles className="size-4" /> Clube CineAstra</div>
            <h1 className="f-display text-6xl font-black leading-[.9] tracking-tight sm:text-7xl md:text-8xl">Mais cinema.<br />Mais vantagens.<br /><span className="text-primary">Mais Astra.</span></h1>
            <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Um só plano para aproveitar o cinema e o streaming. Escolha os benefícios que combinam com você — e compartilhe a experiência com quem quiser.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>Comparar planos <ArrowRight className="size-4" /></Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("compartilhar")?.scrollIntoView({ behavior: "smooth" })}><Users className="size-4" /> Conhecer plano compartilhado</Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Cinema + streaming</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Benefícios mensais</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Cancele pelo sistema</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2rem] border border-dashed border-primary/30 rotate-3" />
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1100&q=85" alt="Poltronas de cinema em uma sala iluminada" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-5 text-white"><div className="text-[10px] font-bold tracking-[.25em] uppercase">Seu ingresso para</div><div className="f-display text-4xl font-black">mais histórias.</div></div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold tracking-[.2em] text-primary uppercase">Clube CineAstra</div><div className="mt-1 text-lg font-black">Uma assinatura. Dois universos.</div></div><div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Clapperboard className="size-5" /></div></div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[[ "Cinema", Ticket ], [ "Streaming", Clapperboard ], [ "AstraSnack", Gift ]].map(([label, Icon]) => <div key={label} className="rounded-lg border border-border/70 bg-background p-3 text-center"><Icon className="mx-auto size-4 text-primary" /><div className="mt-2 text-[10px] font-bold">{label}</div></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-14 md:px-10 md:py-20">
        <div className="text-center">
          <div className="mb-2 text-[10px] font-black tracking-[.25em] text-primary uppercase">Encontre seu plano</div>
          <h2 className="f-display text-5xl font-black sm:text-6xl md:text-7xl">Escolha como viver o cinema<span className="text-primary">.</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">Todos os planos unem vantagens no cinema e no streaming. Compare os benefícios e escolha o seu.</p>
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1.5">
            <button type="button" onClick={() => setBilling("monthly")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Mensal</button>
            <button type="button" onClick={() => setBilling("annual")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${billing === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Anual <span className="ml-1 opacity-80">• economize</span></button>
          </div>
        </div>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const activePrice = priceFor(plan)
            return (
              <article key={plan.id} className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/70 transition-all duration-300 hover:-translate-y-1 ${plan.accent ? "border-primary shadow-xl shadow-primary/10 lg:scale-[1.025]" : "border-border/70"}`}>
                <div className={`px-6 pb-6 pt-6 ${plan.accent ? "bg-primary/10" : ""}`}>
                  <div className="flex items-center justify-between gap-3"><div className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-5" /></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black tracking-wider uppercase ${plan.accent ? "border-primary/30 bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{plan.badge}</span></div>
                  <h3 className="f-display mt-5 text-3xl font-black">{plan.name}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{plan.tagline}</p>
                  <div className="mt-5 flex items-baseline gap-1"><span className="f-display text-5xl font-black">{money(activePrice)}</span><span className="text-xs text-muted-foreground">{periodFor}</span></div>
                  {billing === "annual" ? <p className="mt-2 text-xs font-semibold text-primary">Economize {money(annualSavings(plan))} por ano</p> : <p className="mt-2 text-xs text-muted-foreground">Cobrança mensal recorrente</p>}
                </div>
                <div className="mx-6 border-t border-dashed border-border" />
                <div className="flex flex-1 flex-col p-6 pt-5">
                  <div className="mb-4 text-[10px] font-black tracking-[.2em] text-muted-foreground uppercase">O que está incluído</div>
                  <ul className="space-y-3">
                    {plan.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2.5 text-sm leading-5"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{benefit}</span></li>)}
                  </ul>
                  <Button onClick={() => startSubscription(plan.id)} className="mt-7 w-full" variant={plan.accent ? "default" : "outline"}>Escolher {plan.name} <ArrowRight className="size-4" /></Button>
                </div>
              </article>
            )
          })}
        </div>
        <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">Preços e quantidades de benefícios são ilustrativos para demonstração do projeto. Disponibilidade, regras de uso, catálogo e condições comerciais precisam ser confirmados antes do lançamento.</p>
      </section>

      <section id="compartilhar" className="scroll-mt-24 border-y border-border/70 bg-card/30">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><Users className="size-4" /> Compartilhe a experiência</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Cinema bom é cinema compartilhado<span className="text-primary">.</span></h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Convide pessoas para participar do plano. O titular escolhe como o valor será pago; a composição e as cotas podem ser ajustadas no próximo ciclo de cobrança.</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Wallet className="size-4" /></div><div><div className="text-sm font-bold">Pagador único</div><p className="text-xs leading-5 text-muted-foreground">O titular paga o valor total da assinatura.</p></div></div>
              <div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Users className="size-4" /></div><div><div className="text-sm font-bold">Divisão igual</div><p className="text-xs leading-5 text-muted-foreground">O valor é dividido igualmente entre os participantes incluídos, conforme as regras do plano.</p></div></div>
            </div>
            <Button className="mt-6" onClick={() => setShareOpen((value) => !value)}>{shareOpen ? "Fechar convite" : "Simular convite de participante"} <ArrowRight className="size-4" /></Button>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-black/5 sm:p-7">
            {shareOpen ? (
              inviteSent ? (
                <div className="py-8 text-center"><CheckCircle2 className="mx-auto size-10 text-primary" /><h3 className="f-display mt-3 text-3xl font-black">Convite preparado!</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Esta é uma demonstração. Nenhum convite foi enviado e nenhum participante foi adicionado ao plano.</p><Button variant="outline" className="mt-4" onClick={() => { setInviteSent(false); setInviteContact("") }}>Criar outro convite</Button></div>
              ) : (
                <form onSubmit={submitInvite} className="space-y-4">
                  <div><div className="text-[10px] font-black tracking-[.2em] text-primary uppercase">Convite demonstrativo</div><h3 className="f-display mt-1 text-3xl font-black">Traga sua turma.</h3><p className="mt-2 text-sm text-muted-foreground">Selecione um plano, informe o contato e escolha a forma de divisão.</p></div>
                  <label className="grid gap-1.5 text-xs font-semibold">Plano
                    <select value={sharePlan} onChange={(e) => setSharePlan(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal">{PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold">E-mail ou contato do participante
                    <input required value={inviteContact} onChange={(e) => setInviteContact(e.target.value)} placeholder="contato@exemplo.com" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <fieldset className="grid gap-2"><legend className="mb-1 text-xs font-semibold">Modalidade de pagamento</legend>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${paymentSplit === "titular" ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="split" value="titular" checked={paymentSplit === "titular"} onChange={() => setPaymentSplit("titular")} className="mt-1 accent-[hsl(var(--primary))]" /><span><span className="block text-sm font-bold">Pagador único</span><span className="text-xs text-muted-foreground">Titular paga o valor total.</span></span></label>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${paymentSplit === "dividido" ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="split" value="dividido" checked={paymentSplit === "dividido"} onChange={() => setPaymentSplit("dividido")} className="mt-1 accent-[hsl(var(--primary))]" /><span><span className="block text-sm font-bold">Divisão igual</span><span className="text-xs text-muted-foreground">Cotas iguais a partir do próximo ciclo.</span></span></label>
                  </fieldset>
                  <Button type="submit" className="w-full">Preparar convite <Users className="size-4" /></Button>
                  <p className="text-center text-[10px] leading-5 text-muted-foreground">A inclusão real depende de assinatura ativa, aceite dentro do prazo e notificações implementadas.</p>
                </form>
              )
            ) : (
              <div className="p-2 sm:p-4">
                <div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] font-black tracking-[.2em] text-primary uppercase">Plano em grupo</div><h3 className="f-display mt-1 text-3xl font-black">Sua sessão, sua turma.</h3></div><div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><Heart className="size-6" /></div></div>
                <div className="space-y-3">
                  {[[ "Titular", "Você escolhe o plano e gerencia a assinatura." ], [ "Convite", "Envie um convite para o contato do participante." ], [ "Aceite", "A pessoa aceita dentro do prazo de validade." ], [ "Pagamento", "Escolha pagador único ou divisão igual." ], [ "Próximo ciclo", "Cotas atualizadas e participantes notificados." ]].map(([title, text], i) => <div key={title} className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-xs font-black text-primary">{i + 1}</div><div className="pb-2"><div className="text-sm font-bold">{title}</div><p className="text-xs leading-5 text-muted-foreground">{text}</p></div></div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
          <div><div className="mb-2 text-[10px] font-black tracking-[.25em] text-primary uppercase">Transparência em primeiro lugar</div><h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Você no controle<span className="text-primary">.</span></h2><p className="mt-4 text-sm leading-6 text-muted-foreground">Gerencie sua assinatura e escolha a forma de pagamento com clareza.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-card/60 p-5"><CreditCard className="size-5 text-primary" /><h3 className="mt-3 font-bold">Formas de pagamento</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Cartão de crédito, débito automático e Pix Automático, conforme disponibilidade do provedor de pagamento.</p></div>
            <div className="rounded-xl border border-border/70 bg-card/60 p-5"><ShieldCheck className="size-5 text-primary" /><h3 className="mt-3 font-bold">Cancelamento pelo sistema</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">O titular poderá cancelar a assinatura e os participantes poderão sair do plano sem cancelar para os demais.</p></div>
            <div className="rounded-xl border border-border/70 bg-card/60 p-5"><Gift className="size-5 text-primary" /><h3 className="mt-3 font-bold">Benefícios por ciclo</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Ingressos, combos e cupons têm limites mensais e regras de uso específicas para cada plano.</p></div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5"><ShieldCheck className="size-5 text-primary" /><h3 className="mt-3 font-bold">7 dias para se arrepender</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Após a contratação, você terá 7 dias para exercer o direito de arrependimento e receber o reembolso integral do valor pago, conforme a legislação aplicável.</p></div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/30">
        <div className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-20">
          <div className="mb-8 text-center"><div className="mb-2 text-[10px] font-black tracking-[.25em] text-primary uppercase">Dúvidas frequentes</div><h2 className="f-display text-4xl font-black sm:text-5xl">Antes de dar o play.</h2></div>
          <div className="space-y-3">
            {[
              ["O streaming está incluído em todos os planos?", "Sim. A proposta visual prevê acesso ao catálogo de streaming em todos os planos. Alguns títulos premium podem continuar disponíveis para aluguel avulso, conforme as regras que forem definidas."],
              ["Posso pagar mensal ou anualmente?", "Sim. Você pode alternar entre a opção mensal e anual na comparação de planos. Os preços apresentados são demonstrativos e precisam ser confirmados antes da publicação comercial."],
              ["Como funciona dividir o valor?", "O titular escolhe pagador único ou divisão igual. Na divisão igual, as cotas são recalculadas para o próximo ciclo após alterações nos participantes."],
              ["Posso cancelar ou sair do plano?", "A proposta prevê cancelamento pelo titular e saída individual por participantes. O direito de arrependimento em até 7 dias da contratação permite solicitar o reembolso integral do valor pago, conforme a legislação aplicável. Para outros cancelamentos, as regras serão informadas nos Termos do serviço."],
              ["Quais formas de pagamento estarão disponíveis?", "Cartão de crédito, débito automático e Pix Automático são opções previstas. A disponibilidade real depende da integração com o provedor de pagamento."],
            ].map(([q, a], index) => <div key={q} className="overflow-hidden rounded-xl border border-border/70 bg-card/70"><button type="button" aria-expanded={faqOpen === index} onClick={() => setFaqOpen(faqOpen === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-bold sm:p-5">{q}<ChevronDown className={`size-4 shrink-0 text-primary transition-transform ${faqOpen === index ? "rotate-180" : ""}`} /></button>{faqOpen === index && <div className="border-t border-dashed border-border px-4 py-4 text-sm leading-6 text-muted-foreground sm:px-5">{a}</div>}</div>)}
          </div>
        </div>
      </section>

      <section id="assinar" className="scroll-mt-24 mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        <div className="flex flex-col gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Clapperboard className="size-6" /></div><div><h2 className="f-display text-3xl font-black">Pronto para fazer parte?</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{checkoutNotice ? `Você escolheu o plano ${PLANS.find((p) => p.id === selected)?.name}. A contratação real será habilitada quando o fluxo de pagamento estiver integrado.` : "Escolha seu plano e tenha mais motivos para viver o cinema."}</p></div></div>
          <div className="flex flex-wrap gap-2"><Button onClick={() => { setCheckoutNotice(false); document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" }) }} variant="outline">Comparar novamente</Button><Button render={<Link href="/cadastro" />}>Criar conta <ArrowRight className="size-4" /></Button></div>
        </div>
      </section>
    </main>
  )
}
