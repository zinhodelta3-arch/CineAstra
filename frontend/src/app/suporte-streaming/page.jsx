"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft, ArrowRight, CircleHelp, CirclePlay, CircleUserRound,
  Clapperboard, ChevronDown, CircleCheck, CreditCard, Headphones,
  MonitorPlay, Search, Settings2, ShieldCheck, Smartphone, Tv, Wifi, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const CATEGORIES = [
  {
    id: "reproducao", label: "Reprodução", icon: CirclePlay,
    description: "Filmes que não iniciam, travam ou param no meio.",
    questions: [
      ["O filme não começa. O que posso fazer?", "Confira sua conexão com a internet e tente atualizar a página ou reiniciar o aplicativo. Se o problema continuar, teste outro título para descobrir se acontece em todo o catálogo."],
      ["O vídeo fica carregando ou travando.", "Pause o filme por alguns segundos, verifique se outros dispositivos estão usando a rede e, se possível, aproxime-se do roteador ou conecte-se a uma rede mais estável. Você também pode reduzir a qualidade de reprodução nas configurações, se essa opção estiver disponível."],
      ["O filme parou antes de terminar.", "Abra o título novamente e verifique se a opção de continuar assistindo aparece. Se o progresso não for recuperado, anote o nome do título e o horário aproximado em que o erro aconteceu para informar ao suporte."],
    ],
  },
  {
    id: "qualidade", label: "Imagem e áudio", icon: MonitorPlay,
    description: "Resolução, legendas, dublagem e som.",
    questions: [
      ["Como altero a qualidade do vídeo?", "Quando o player oferecer essa opção, abra as configurações de reprodução e selecione a qualidade desejada. A resolução disponível pode variar conforme o título, o dispositivo e a velocidade da conexão."],
      ["O áudio está dessincronizado ou não sai som.", "Confira o volume do dispositivo e as configurações de saída de áudio. Tente pausar e retomar o vídeo ou reiniciar a reprodução. Se acontecer apenas em um título, informe o nome do filme ao suporte."],
      ["Como ativo legendas ou altero o idioma?", "Durante a reprodução, abra o menu de áudio e legendas do player e selecione uma das opções disponíveis. Nem todos os idiomas estão disponíveis em todos os títulos."],
    ],
  },
  {
    id: "conta", label: "Conta e acesso", icon: CircleUserRound,
    description: "Login, senha e dispositivos conectados.",
    questions: [
      ["Não consigo entrar na minha conta.", "Confira se o e-mail e a senha foram digitados corretamente. Se necessário, use a opção de recuperação de senha na tela de login e siga as instruções recebidas."],
      ["Esqueci minha senha. Como redefino?", "Na tela de login, selecione “Esqueci minha senha” e informe o e-mail cadastrado. Se não receber a mensagem, verifique a caixa de spam e confirme se digitou o endereço correto."],
      ["Posso assistir em mais de um dispositivo?", "A quantidade de dispositivos e reproduções simultâneas depende das regras do plano contratado. Consulte os detalhes do seu plano na área da conta."],
    ],
  },
  {
    id: "assinatura", label: "Planos e pagamentos", icon: CreditCard,
    description: "Assinatura, cobrança e cancelamento.",
    questions: [
      ["Onde vejo meu plano atual?", "Acesse sua conta e procure a área de assinatura ou plano. Nela devem aparecer os detalhes do plano e as opções de gerenciamento disponíveis."],
      ["Minha assinatura foi paga, mas o acesso não foi liberado.", "Confira se o pagamento foi confirmado e atualize sua conta. Evite fazer uma nova compra antes de verificar a situação. Se o acesso não for liberado, entre em contato com o suporte com a data e o comprovante da cobrança."],
      ["Como faço para cancelar minha assinatura?", "Entre na sua conta, abra a área de assinatura e procure a opção de cancelamento, quando disponível. Confira as condições apresentadas antes de confirmar. O cancelamento e eventuais reembolsos seguem os termos aplicáveis e a legislação vigente."],
      ["Tenho direito ao arrependimento em até 7 dias?", "Para contratações abrangidas pelo direito de arrependimento previsto na legislação aplicável, você pode solicitar o cancelamento e o reembolso integral dentro do prazo legal de 7 dias. Consulte os termos da contratação e use o canal de atendimento para registrar a solicitação."],
    ],
  },
  {
    id: "dispositivos", label: "Dispositivos", icon: Tv,
    description: "Smart TV, celular, tablet e computador.",
    questions: [
      ["Em quais dispositivos posso assistir?", "A compatibilidade depende dos dispositivos e navegadores suportados pelo serviço. Use uma versão atualizada do navegador ou do aplicativo, quando houver."],
      ["A tela fica preta na minha TV ou no celular.", "Feche e abra novamente o aplicativo ou navegador, reinicie o dispositivo e verifique se há atualizações disponíveis. Se o problema persistir, informe o modelo do aparelho e o sistema utilizado."],
      ["Posso continuar assistindo de onde parei?", "Quando o recurso de progresso estiver disponível e sincronizado com sua conta, o título poderá aparecer na seção “Continuar assistindo”. A disponibilidade pode variar conforme o dispositivo."],
    ],
  },
  {
    id: "seguranca", label: "Segurança e privacidade", icon: ShieldCheck,
    description: "Proteção da conta e dados pessoais.",
    questions: [
      ["Acho que outra pessoa acessou minha conta.", "Altere sua senha assim que possível e não compartilhe códigos de acesso. Se houver uma opção para encerrar sessões em outros dispositivos, utilize-a. Depois, entre em contato com o suporte para relatar a atividade suspeita."],
      ["Como posso solicitar informações sobre meus dados?", "Consulte a Política de Privacidade e use os canais oficiais de atendimento para solicitar informações ou exercer os direitos previstos na legislação de proteção de dados."],
    ],
  },
]

const QUICK_LINKS = [
  { label: "Problemas ao reproduzir", category: "reproducao", icon: CirclePlay },
  { label: "Imagem, áudio e legendas", category: "qualidade", icon: Settings2 },
  { label: "Acesso à minha conta", category: "conta", icon: CircleUserRound },
  { label: "Assinatura e cobrança", category: "assinatura", icon: CreditCard },
]

export default function StreamingSupportPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("todos")
  const [openQuestion, setOpenQuestion] = useState("reproducao-0")
  const [contactType, setContactType] = useState("tecnico")
  const [contactSent, setContactSent] = useState(false)

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR")
    return CATEGORIES
      .filter((category) => activeCategory === "todos" || category.id === activeCategory)
      .map((category) => ({
        ...category,
        questions: category.questions
          .map(([q, a], index) => ({ q, a, id: `${category.id}-${index}` }))
          .filter((item) => !term || `${category.label} ${item.q} ${item.a}`.toLocaleLowerCase("pt-BR").includes(term)),
      }))
      .filter((category) => category.questions.length > 0)
  }, [search, activeCategory])

  const selectCategory = (id) => {
    setActiveCategory(id)
    setOpenQuestion(id === "todos" ? "" : `${id}-0`)
    document.getElementById("central-ajuda")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_75%_15%,hsl(var(--primary)/.20),transparent_48%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--card)))]" />
        <div className="absolute -right-20 top-16 -z-10 size-72 rounded-full border border-primary/20 md:size-[28rem]" />
        <div className="absolute -right-8 top-28 -z-10 size-56 rounded-full border border-dashed border-primary/25 md:size-[22rem]" />
        <div className="mx-auto max-w-[1600px] px-5 pb-14 pt-8 md:px-10 md:pb-20 md:pt-12">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition hover:text-primary">
            <ArrowLeft className="size-4" /> Voltar ao CineAstra
          </Link>
          <div className="grid items-center gap-10 pt-12 md:grid-cols-[1.15fr_.85fr] md:pt-16">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-2 text-[10px] font-black tracking-[.3em] text-primary uppercase"><Headphones className="size-4" /> CineAstra • Streaming</div>
              <h1 className="f-display text-6xl font-black leading-[.9] tracking-tight sm:text-7xl md:text-8xl">Sua próxima<br />sessão começa<br /><span className="text-primary">com uma solução.</span></h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Estamos aqui para ajudar você a voltar ao filme. Encontre respostas para problemas de reprodução, imagem, áudio, conta e assinatura.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => document.getElementById("central-ajuda")?.scrollIntoView({ behavior: "smooth" })}>Encontrar uma resposta <ArrowRight className="size-4" /></Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById("falar-suporte")?.scrollIntoView({ behavior: "smooth" })}>Falar com o suporte <Headphones className="size-4" /></Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-2"><CircleCheck className="size-4 text-primary" /> Guia de solução de problemas</span>
                <span className="flex items-center gap-2"><Smartphone className="size-4 text-primary" /> Ajuda para seus dispositivos</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-4 rotate-3 rounded-[2rem] border border-dashed border-primary/30" />
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/50 via-card to-background">
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(var(--primary) / .35), transparent 35%), radial-gradient(circle at 80% 75%, hsl(var(--primary) / .2), transparent 40%)" }} />
                  <div className="relative grid size-36 place-items-center rounded-[2rem] border border-primary/30 bg-background/70 shadow-xl shadow-primary/10 backdrop-blur-sm sm:size-44">
                    <div className="absolute inset-3 rounded-[1.5rem] border border-dashed border-primary/25" />
                    <Clapperboard className="size-14 text-primary sm:size-16" />
                    <span className="absolute -bottom-3 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-[10px] font-black tracking-[.2em] text-primary uppercase">Central de ajuda</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] font-bold tracking-[.2em] text-primary uppercase">CineAstra Streaming</div>
                  <div className="mt-1 text-lg font-black">Vamos resolver isso juntos.</div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[[ "Reprodução", CirclePlay ], [ "Dispositivos", Tv ], [ "Conta", CircleUserRound ]].map(([label, Icon]) => <div key={label} className="rounded-lg border border-border/70 bg-background p-3 text-center"><Icon className="mx-auto size-4 text-primary" /><div className="mt-2 text-[10px] font-bold">{label}</div></div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><div className="mb-2 text-[10px] font-black tracking-[.25em] text-primary uppercase">Acesso rápido</div><h2 className="f-display text-4xl font-black sm:text-5xl">Por onde começamos?</h2></div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">Escolha o assunto e vá direto às orientações mais relevantes.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map(({ label, category, icon: Icon }) => <button key={category} type="button" onClick={() => selectCategory(category)} className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><span className="min-w-0 flex-1 text-sm font-bold">{label}</span><ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></button>)}
        </div>
      </section>

      <section id="central-ajuda" className="scroll-mt-8 border-y border-border/70 bg-card/25">
        <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
          <div className="mb-8 text-center">
            <div className="mb-2 text-[10px] font-black tracking-[.25em] text-primary uppercase">Central CineAstra</div>
            <h2 className="f-display text-5xl font-black sm:text-6xl">Dúvidas frequentes<span className="text-primary">.</span></h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Pesquise sua dúvida ou navegue pelas categorias para encontrar uma solução.</p>
            <div className="relative mx-auto mt-6 flex h-12 w-full max-w-2xl items-center">
              <Search className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
              <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: vídeo travando, legenda, cobrança..." aria-label="Pesquisar dúvidas do streaming" className="h-full rounded-xl border-border bg-card pl-11 pr-11 shadow-none" />
              {search && <Button type="button" variant="ghost" size="icon" className="absolute right-1 size-9 rounded-full text-muted-foreground" onClick={() => setSearch("")} aria-label="Limpar pesquisa"><X className="size-4" /></Button>}
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <Button type="button" variant={activeCategory === "todos" ? "default" : "outline"} className="shrink-0 rounded-lg" onClick={() => { setActiveCategory("todos"); setOpenQuestion(""); }}>Todas as dúvidas</Button>
            {CATEGORIES.map(({ id, label, icon: Icon }) => <Button key={id} type="button" variant={activeCategory === id ? "default" : "outline"} className="shrink-0 rounded-lg" onClick={() => { setActiveCategory(id); setOpenQuestion(`${id}-0`); }}><Icon className="mr-1 size-4" />{label}</Button>)}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCategories.map((category) => {
              const Icon = category.icon
              return <article key={category.id} className="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
                <div className="flex items-center gap-3 border-b border-dashed border-border p-5">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-5" /></div>
                  <div><div className="text-[10px] font-bold tracking-[.18em] text-primary uppercase">{category.questions.length} {category.questions.length === 1 ? "pergunta" : "perguntas"}</div><h3 className="text-lg font-black">{category.label}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{category.description}</p></div>
                </div>
                <div className="divide-y divide-border/70">
                  {category.questions.map((item) => <div key={item.id} className="px-5">
                    <button type="button" aria-expanded={openQuestion === item.id} onClick={() => setOpenQuestion(openQuestion === item.id ? "" : item.id)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold transition hover:text-primary"><span>{item.q}</span><ChevronDown className={`size-4 shrink-0 text-primary transition-transform ${openQuestion === item.id ? "rotate-180" : ""}`} /></button>
                    {openQuestion === item.id && <p className="pb-5 pr-5 text-sm leading-6 text-muted-foreground">{item.a}</p>}
                  </div>)}
                </div>
              </article>
            })}
          </div>
          {filteredCategories.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card/50 px-5 py-12 text-center"><Search className="mx-auto size-8 text-primary" /><h3 className="mt-3 text-lg font-black">Não encontramos essa dúvida.</h3><p className="mt-1 text-sm text-muted-foreground">Tente outro termo ou veja todas as categorias.</p><Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setActiveCategory("todos"); }}>Limpar filtros</Button></div>}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><Wifi className="size-4" /> Diagnóstico rápido</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Antes de apertar o play<span className="text-primary">.</span></h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Se a reprodução não estiver funcionando como esperado, experimente estes passos básicos.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["1", "Verifique a conexão", "Confirme se outros sites ou aplicativos estão funcionando normalmente."],
              ["2", "Atualize o aplicativo", "Use uma versão recente do navegador ou do aplicativo, quando disponível."],
              ["3", "Reinicie a reprodução", "Feche o vídeo, abra novamente e confira se o problema continua."],
              ["4", "Teste outro título", "Isso ajuda a identificar se o erro acontece em um filme específico."],
            ].map(([number, title, description]) => <div key={number} className="flex gap-3 rounded-xl border border-border/70 bg-card/60 p-4"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-black text-primary">{number}</div><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div></div>)}
          </div>
        </div>
      </section>

      <section id="falar-suporte" className="scroll-mt-8 border-y border-border/70 bg-card/30">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><Headphones className="size-4" /> Atendimento CineAstra</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Ainda precisa de ajuda<span className="text-primary">?</span></h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Prepare os detalhes do problema para facilitar o atendimento. Esta área é uma demonstração visual e ainda não envia solicitações para uma equipe.</p>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2"><CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Nome do título ou filme</p>
              <p className="flex items-start gap-2"><CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Dispositivo e navegador utilizados</p>
              <p className="flex items-start gap-2"><CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Mensagem de erro e horário aproximado</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-black/5 sm:p-7">
            {contactSent ? <div role="status" className="py-10 text-center"><CircleCheck className="mx-auto size-10 text-primary" /><h3 className="f-display mt-4 text-3xl font-black">Solicitação preparada!</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Esta é uma demonstração: nenhuma mensagem foi enviada. A integração com o atendimento será adicionada posteriormente.</p><Button variant="outline" className="mt-5" onClick={() => setContactSent(false)}>Preparar outra solicitação</Button></div> : <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setContactSent(true); }}>
              <div className="border-b border-dashed border-border pb-5"><div className="text-[10px] font-black tracking-[.2em] text-primary uppercase">Formulário demonstrativo</div><h3 className="f-display mt-1 text-3xl font-black">Conte o que aconteceu.</h3></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold">Seu nome<input required name="name" placeholder="Nome completo" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <label className="grid gap-1.5 text-xs font-semibold">E-mail de contato<input required type="email" name="email" placeholder="voce@exemplo.com" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
              </div>
              <label className="grid gap-1.5 text-xs font-semibold">Assunto<select value={contactType} onChange={(event) => setContactType(event.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal"><option value="tecnico">Problema técnico / reprodução</option><option value="conta">Conta e acesso</option><option value="assinatura">Plano, cobrança ou cancelamento</option><option value="outro">Outro assunto</option></select></label>
              <label className="grid gap-1.5 text-xs font-semibold">Descreva o problema<textarea required name="message" rows={4} placeholder="O que aconteceu? Em qual dispositivo? Apareceu alguma mensagem de erro?" className="resize-y rounded-lg border border-border bg-background px-3 py-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
              <Button type="submit" size="lg" className="w-full">Preparar solicitação <ArrowRight className="size-4" /></Button>
              <p className="text-center text-[10px] leading-5 text-muted-foreground">Não informe senhas ou dados completos de cartão neste formulário.</p>
            </form>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-14">
        <div className="flex flex-col gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CircleHelp className="size-6" /></div><div><h2 className="f-display text-3xl font-black">Quer voltar para a programação?</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Continue explorando o CineAstra e encontre sua próxima história.</p></div></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" render={<Link href="/planos" />}>Ver planos <ArrowRight className="size-4" /></Button><Button render={<Link href="/" />}>Ir para o início <ArrowRight className="size-4" /></Button></div>
        </div>
      </section>
    </main>
  )
}
