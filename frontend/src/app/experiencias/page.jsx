"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays,
  CheckCircle2, ChevronRight, CircleHelp, Clock3, Film, MapPin,
  MessageCircle, MoonStar, PartyPopper, PlayCircle, Star, Users,
  Building2, CarFront, Trees, Sparkles, Projector, Ticket,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const U = (id, w = 1400, h = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=85`

const EXPERIENCES = [
  {
    id: "sala-privativa",
    number: "01",
    eyebrow: "Sua sessão. Suas regras.",
    title: "Uma sala só sua",
    short: "Alugue uma sala de cinema inteira para transformar seu evento em uma estreia inesquecível.",
    description: "Reúna sua turma em uma tela gigante, com som imersivo e conforto de cinema. Ideal para aniversários, festas escolares, encontros de família, palestras, treinamentos, eventos corporativos e sessões exclusivas.",
    image: U("photo-1489599849927-2ee91cede3ba", 1600, 1050),
    price: "R$ 790",
    unit: "por sessão / pacote inicial",
    icon: Film,
    tag: "Mais versátil",
    details: ["Aniversários e comemorações", "Festinhas e passeios escolares", "Eventos de empresas e palestras", "Sessões privadas de filmes"],
  },
  {
    id: "ceu-aberto",
    number: "02",
    eyebrow: "Cinema sob as estrelas",
    title: "Cinema a céu aberto",
    short: "Uma sessão ao ar livre, com clima de festival e aquele encanto de assistir a um filme sob o céu.",
    description: "Levamos a magia do cinema para parques, jardins, pátios e espaços abertos. Uma experiência acolhedora para eventos culturais, encontros comunitários, escolas, empresas e celebrações especiais.",
    image: U("photo-1500530855697-b586d89ba3ee", 1600, 1050),
    price: "R$ 1.490",
    unit: "por evento / estrutura inicial",
    icon: Trees,
    tag: "Ao ar livre",
    details: ["Eventos em parques e jardins", "Sessões comunitárias e culturais", "Encontros escolares e familiares", "Eventos de marcas e empresas"],
  },
  {
    id: "drive-in",
    number: "03",
    eyebrow: "Conforto no seu carro",
    title: "Cinema drive-in",
    short: "Curta um clássico ou um lançamento especial sem sair do carro, com uma tela gigante à sua frente.",
    description: "Uma experiência nostálgica e diferente, perfeita para encontros, eventos temáticos, ações de marca e noites especiais. A estrutura é planejada conforme o local, a quantidade de veículos e as necessidades do evento.",
    image: U("photo-1519608487953-e999c86e7455", 1600, 1050),
    price: "R$ 1.990",
    unit: "por evento / estrutura inicial",
    icon: CarFront,
    tag: "Experiência especial",
    details: ["Noites temáticas e encontros", "Eventos corporativos e de marca", "Sessões para grupos e comunidades", "Programações especiais para famílias"],
  },
]

const BENEFITS = [
  { icon: Projector, title: "Imagem e som de cinema", text: "Estrutura audiovisual pensada para valorizar cada cena." },
  { icon: Users, title: "Feito para o seu grupo", text: "Planejamento de acordo com o público e o formato do evento." },
  { icon: CalendarDays, title: "Planejamento com você", text: "Alinhamos data, local, duração e necessidades antes da confirmação." },
  { icon: Sparkles, title: "Uma experiência memorável", text: "Mais do que assistir a um filme: criar uma lembrança juntos." },
]

const TESTIMONIALS = [
  { name: "Organização de evento escolar", type: "Sala privativa", quote: "Uma proposta diferente para reunir a turma e transformar o passeio em uma ocasião especial.", rating: 5 },
  { name: "Equipe de eventos corporativos", type: "Sessão exclusiva", quote: "O formato de sessão privada é uma alternativa interessante para apresentações e encontros de equipe.", rating: 5 },
  { name: "Produção de evento ao ar livre", type: "Cinema a céu aberto", quote: "A combinação de filme, espaço aberto e convivência deixa o evento com uma atmosfera muito própria.", rating: 5 },
]

export default function ExperienciasPage() {
  const [selectedExperience, setSelectedExperience] = useState("sala-privativa")
  const [sent, setSent] = useState(false)

  const chooseExperience = (id) => {
    setSelectedExperience(id)
    setSent(false)
    document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const submitInquiry = (event) => {
    event.preventDefault()
    setSent(true)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate min-h-[590px] overflow-hidden border-b border-border/70 bg-background md:min-h-[690px]">
        <img
          src={U("photo-1485846234645-a62644f84728", 2200, 1300)}
          alt="Tela de cinema iluminada em uma sala escura"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/15" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/20" />
        <div className="absolute inset-x-0 top-0 h-3 bg-[repeating-linear-gradient(90deg,var(--primary)_0_12px,transparent_12px_26px)] opacity-70" />
        <div className="mx-auto flex min-h-[590px] max-w-[1600px] items-end px-5 pb-14 pt-24 md:min-h-[690px] md:px-10 md:pb-20">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-[10px] font-black tracking-[.3em] text-primary uppercase">
              <Sparkles className="size-4" /> CineAstra • Experiências
            </div>
            <h1 className="f-display text-6xl font-black leading-[.9] tracking-tight sm:text-7xl md:text-8xl">
              O cinema vai<br />muito <span className="text-primary">além</span><br />da sessão.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
              Uma sala inteira só para vocês, filmes sob as estrelas ou a nostalgia do drive-in.
              Escolha o formato e vamos planejar uma experiência que tem tudo a ver com seu evento.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => chooseExperience("sala-privativa")}>
                Planejar minha experiência <ArrowDownRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("experiencias")?.scrollIntoView({ behavior: "smooth" })}>
                Conhecer as opções <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-foreground/70">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Para grupos e empresas</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Formatos personalizados</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Orçamento sob consulta</span>
            </div>
          </div>
        </div>
      </section>

      <section id="experiencias" className="mx-auto max-w-[1600px] scroll-mt-24 px-5 py-14 md:px-10 md:py-20">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><span className="h-px w-7 bg-primary" /> Escolha seu formato</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl md:text-7xl">Experiências<br className="sm:hidden" /> extraordinárias<span className="text-primary">.</span></h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">De uma comemoração intimista a um evento para muita gente: encontre o cenário perfeito para sua próxima história.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {EXPERIENCES.map((experience) => {
            const Icon = experience.icon
            return (
              <article key={experience.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
                <div className="relative aspect-[5/3] overflow-hidden bg-muted">
                  <img src={experience.image} alt={experience.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                    <Icon className="size-3.5" /> {experience.tag}
                  </div>
                  <span className="f-display absolute right-4 bottom-2 text-6xl font-black text-white/60">{experience.number}</span>
                </div>
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <div className="text-[10px] font-black tracking-[.22em] text-primary uppercase">{experience.eyebrow}</div>
                  <h3 className="f-display mt-2 text-3xl font-black leading-none sm:text-4xl">{experience.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{experience.short}</p>
                  <div className="my-5 border-y border-dashed border-border/80 py-4">
                    <div className="text-[10px] font-bold tracking-[.2em] text-muted-foreground uppercase">Valores a partir de</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="f-display text-4xl font-black text-primary">{experience.price}</span>
                      <span className="text-[10px] text-muted-foreground">{experience.unit}</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Estimativa ilustrativa. O valor final depende de data, duração, local, estrutura e quantidade de pessoas.</p>
                  </div>
                  <div className="mb-5 space-y-2">
                    {experience.details.map((detail) => <div key={detail} className="flex items-start gap-2 text-xs text-foreground/80"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>{detail}</span></div>)}
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button onClick={() => chooseExperience(experience.id)} className="w-full">Reservar <ArrowRight className="size-4" /></Button>
                    <Button variant="outline" onClick={() => chooseExperience(experience.id)} className="w-full">Saber mais</Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/30">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 md:px-10 md:py-16">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-5" /></div>
              <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><Star className="size-3.5" /> Experiências que conectam</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Momentos que<br />merecem replay<span className="text-primary">.</span></h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Cada evento tem sua própria história. Queremos que a experiência seja planejada com cuidado, do primeiro contato até os créditos finais.</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Star className="size-4 fill-primary text-primary" /><span>Exemplos de depoimentos para demonstração do layout.</span></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((review) => (
              <article key={review.name} className="rounded-2xl border border-border/70 bg-card/70 p-5">
                <div className="mb-4 flex gap-1 text-primary">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="size-3.5 fill-current" />)}</div>
                <p className="text-sm leading-6 text-foreground/85">“{review.quote}”</p>
                <div className="mt-5 border-t border-dashed border-border pt-4">
                  <div className="text-sm font-bold">{review.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{review.type}</div>
                  <div className="mt-3 inline-flex rounded-full border border-border px-2 py-1 text-[9px] font-bold tracking-wider text-muted-foreground uppercase">Depoimento ilustrativo</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reservar" className="scroll-mt-24 border-y border-border/70 bg-card/30">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-primary uppercase"><CalendarDays className="size-4" /> Vamos conversar</div>
            <h2 className="f-display text-5xl font-black leading-none sm:text-6xl">Sua próxima<br />história começa aqui<span className="text-primary">.</span></h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Conte um pouco sobre o evento. Nossa equipe poderá entender suas necessidades e preparar uma proposta personalizada.</p>
            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-4 text-primary" /><div><div className="text-sm font-bold">Data e duração</div><p className="text-xs text-muted-foreground">Informe a data desejada e o tempo estimado.</p></div></div>
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 text-primary" /><div><div className="text-sm font-bold">Local e estrutura</div><p className="text-xs text-muted-foreground">Para eventos externos, a disponibilidade depende do local e da infraestrutura.</p></div></div>
              <div className="flex items-start gap-3"><MessageCircle className="mt-0.5 size-4 text-primary" /><div><div className="text-sm font-bold">Proposta sob medida</div><p className="text-xs text-muted-foreground">Os valores exibidos são iniciais e precisam de confirmação pela equipe.</p></div></div>
            </div>
          </div>

          <form onSubmit={submitInquiry} className="rounded-2xl border border-border/70 bg-card p-5 shadow-xl shadow-black/5 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-dashed border-border pb-5">
              <div><div className="text-[10px] font-black tracking-[.22em] text-primary uppercase">Pedido de informações</div><h3 className="f-display mt-1 text-3xl font-black">Conte pra gente.</h3></div>
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><PartyPopper className="size-6" /></div>
            </div>
            {sent ? (
              <div role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-6 text-center">
                <CheckCircle2 className="mx-auto size-9 text-primary" />
                <h4 className="mt-3 text-lg font-black">Solicitação preparada!</h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Esta é uma demonstração de interface: os dados não foram enviados a uma equipe nem geraram uma reserva real.</p>
                <Button type="button" variant="outline" className="mt-4" onClick={() => setSent(false)}>Enviar outra solicitação</Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">Nome
                    <input required name="name" placeholder="Como podemos te chamar?" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">E-mail ou telefone
                    <input required name="contact" placeholder="Seu melhor contato" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:col-span-2">Experiência desejada
                    <select value={selectedExperience} onChange={(event) => setSelectedExperience(event.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15">
                      {EXPERIENCES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">Data desejada
                    <input type="date" name="date" min={new Date().toISOString().slice(0, 10)} className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground">Quantidade de pessoas/veículos
                    <input type="number" name="guests" min="1" placeholder="Ex.: 40" className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:col-span-2">Conte mais sobre seu evento
                    <textarea name="details" rows={4} placeholder="Tipo de evento, cidade/local, duração e o que você imagina..." className="resize-y rounded-lg border border-border bg-background px-3 py-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </label>
                </div>
                <Button type="submit" size="lg" className="mt-5 w-full">Solicitar informações <ArrowUpRight className="size-4" /></Button>
                <p className="mt-3 text-center text-[10px] leading-5 text-muted-foreground">Preenchimento demonstrativo. A integração de envio e a confirmação de reservas serão implementadas posteriormente.</p>
              </>
            )}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        <div className="flex flex-col gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CircleHelp className="size-6" /></div><div><h2 className="f-display text-3xl font-black">Ainda tem dúvidas?</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Acesse a central de suporte ou conheça o restante do CineAstra.</p></div></div>
          <div className="flex flex-wrap gap-2"><Button render={<Link href="/suporte" />} variant="outline">Central de suporte <ArrowRight className="size-4" /></Button><Button render={<Link href="/" />}>Voltar ao início <ArrowLeft className="size-4" /></Button></div>
        </div>
      </section>
    </main>
  )
}
