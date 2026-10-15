"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  ChevronRight,
  X,
  CircleHelp,
  CreditCard,
  Film,
  Gift,
  KeyRound,
  MapPin,
  Popcorn,
  Search,
  SendHorizontal,
  ShieldCheck,
  Ticket,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const categories = [
  {
    id: "ingressos",
    label: "Ingressos",
    icon: Ticket,
    questions: [
      {
        q: "Como comprar meu ingresso?",
        a: "Escolha o filme, cinema, data e horário da sessão. Depois selecione os assentos, escolha o tipo de ingresso e conclua o pagamento. O ingresso fica disponível na sua conta após a confirmação da compra.",
      },
      {
        q: "Onde encontro meus ingressos?",
        a: "Depois de fazer login, acesse a área de pedidos da sua conta. Seus ingressos ficam vinculados às compras realizadas pelo CineAstra e podem ser consultados antes da sessão.",
      },
      {
        q: "Posso alterar o cinema, horário ou assento depois da compra?",
        a: "A alteração depende das regras da compra e da disponibilidade da nova sessão. Quando a troca direta não estiver disponível, pode ser necessário cancelar a compra elegível e realizar uma nova.",
      },
    ],
  },
  {
    id: "cancelamento",
    label: "Cancelamento",
    icon: CalendarDays,
    questions: [
      {
        q: "Posso cancelar meu ingresso?",
        a: "Sim, quando a compra estiver dentro das regras de cancelamento do CineAstra. O prazo e as condições são informados no momento da compra e podem variar conforme o tipo de pedido.",
      },
      {
        q: "Como faço para cancelar uma compra?",
        a: "Entre na sua conta, abra seus pedidos, selecione a compra e procure pela opção de cancelamento. Se a opção não estiver disponível, o pedido pode estar fora do prazo ou não ser elegível para cancelamento.",
      },
      {
        q: "Quando recebo o reembolso?",
        a: "Depois que o cancelamento for confirmado, o prazo de estorno depende do meio de pagamento e da instituição financeira. O CineAstra exibirá a confirmação do cancelamento na sua conta.",
      },
    ],
  },
  {
    id: "login",
    label: "Seu login",
    icon: KeyRound,
    questions: [
      {
        q: "Esqueci minha senha. O que faço?",
        a: "Na página de login, clique em “Esqueci minha senha” e informe o e-mail da sua conta. Siga as instruções enviadas para criar uma nova senha.",
      },
      {
        q: "Esqueci o e-mail que usei no cadastro. E agora?",
        a: "Se você não conseguir identificar o e-mail da conta, procure o suporte do CineAstra com os dados necessários para confirmar sua identidade. Não compartilhe sua senha com ninguém.",
      },
      {
        q: "Posso alterar meus dados cadastrais?",
        a: "Sim. Quando essa função estiver disponível na sua área de conta, você poderá revisar e atualizar seus dados pessoais. Algumas alterações podem exigir uma confirmação de segurança.",
      },
    ],
  },
  {
    id: "classificacao",
    label: "Classificação indicativa",
    icon: UsersRound,
    questions: [
      {
        q: "Onde vejo a classificação indicativa de um filme?",
        a: "A classificação indicativa aparece nas informações de cada filme no CineAstra. Confira essa informação antes de comprar o ingresso.",
      },
      {
        q: "O que significa a classificação indicativa?",
        a: "Ela orienta sobre a faixa etária recomendada para o conteúdo do filme. As regras de acesso de crianças e adolescentes seguem a legislação brasileira e podem exigir acompanhamento ou autorização em determinadas situações.",
      },
      {
        q: "Menores de idade podem assistir a qualquer filme?",
        a: "Não. A entrada depende da classificação do filme e das regras legais aplicáveis à idade do espectador. Em caso de dúvida, confira a classificação indicada na página do filme e as orientações oficiais.",
      },
    ],
  },
  {
    id: "promocoes",
    label: "Promoções",
    icon: Gift,
    questions: [
      {
        q: "Onde encontro as promoções do CineAstra?",
        a: "As promoções disponíveis aparecem nos canais oficiais do CineAstra. Cada oferta informa seu período de validade, cinemas participantes e condições de utilização.",
      },
      {
        q: "Posso usar mais de uma promoção na mesma compra?",
        a: "Isso depende das regras de cada campanha. Algumas promoções não são cumulativas com outros descontos, benefícios ou tipos de ingresso.",
      },
      {
        q: "Por que uma promoção não aparece para mim?",
        a: "Verifique se sua conta atende aos critérios da campanha, se o cinema e a sessão participam e se a promoção ainda está dentro do período de validade.",
      },
    ],
  },
  {
    id: "reserva",
    label: "Reserva de eventos",
    icon: MapPin,
    questions: [
      {
        q: "Posso reservar uma sala para um evento?",
        a: "O CineAstra pode disponibilizar reservas para eventos, sessões especiais e experiências em grupo. Consulte a área de eventos ou entre em contato com o suporte para verificar disponibilidade.",
      },
      {
        q: "Como solicito uma reserva para um grupo?",
        a: "Informe a quantidade aproximada de pessoas, cinema desejado, data, horário e tipo de evento. A disponibilidade depende da programação e da capacidade da sala.",
      },
    ],
  },
  {
    id: "snack",
    label: "AstraSnack",
    icon: Popcorn,
    questions: [
      {
        q: "Posso comprar snacks junto com meu ingresso?",
        a: "Sim. Quando disponível para a sessão escolhida, você pode adicionar produtos do AstraSnack ao pedido antes de finalizar a compra.",
      },
      {
        q: "Como retiro meu pedido do AstraSnack?",
        a: "Apresente o código ou comprovante do pedido no balcão do AstraSnack do cinema selecionado. O pedido deve ser retirado conforme as condições exibidas no momento da compra.",
      },
    ],
  },
  {
    id: "pagamento",
    label: "Pagamentos",
    icon: CreditCard,
    questions: [
      {
        q: "Quais formas de pagamento posso usar?",
        a: "As formas de pagamento disponíveis são apresentadas na etapa final da compra. A disponibilidade pode variar conforme o canal e o tipo de produto.",
      },
      {
        q: "O pagamento foi aprovado, mas não recebi o ingresso.",
        a: "Primeiro confira seus pedidos e o e-mail cadastrado. Se o pagamento tiver sido aprovado e o pedido não aparecer, evite realizar uma segunda compra e procure o suporte com o comprovante da transação.",
      },
    ],
  },
  {
    id: "salas",
    label: "Salas e tecnologias",
    icon: Film,
    questions: [
      {
        q: "Onde vejo informações sobre as salas?",
        a: "Na página do cinema e durante a escolha da sessão você poderá consultar os formatos disponíveis, como salas especiais e tecnologias de exibição.",
      },
      {
        q: "O que faço se tiver um problema durante a sessão?",
        a: "Procure imediatamente um integrante da equipe do cinema. Para problemas relacionados à compra, pagamento ou conta, registre também a ocorrência pelo suporte do CineAstra.",
      },
    ],
  },
  {
    id: "privacidade",
    label: "Privacidade e dados",
    icon: ShieldCheck,
    questions: [
      {
        q: "Como o CineAstra utiliza meus dados?",
        a: "Os dados são utilizados de acordo com a Política de Privacidade do CineAstra, para finalidades como criação da conta, processamento de pedidos, atendimento e funcionamento dos serviços.",
      },
      {
        q: "Como posso solicitar informações sobre meus dados?",
        a: "Você pode entrar em contato pelos canais de atendimento indicados pelo CineAstra para exercer os direitos previstos na legislação de proteção de dados.",
      },
    ],
  },
];

export default function SupportCenter() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [openQuestion, setOpenQuestion] = useState("ingressos-0");

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    return categories
      .filter((category) => activeCategory === "todos" || category.id === activeCategory)
      .map((category) => ({
        ...category,
        questions: category.questions.filter((item) => {
          if (!term) return true;
          return `${category.label} ${item.q} ${item.a}`.toLowerCase().includes(term);
        }),
      }))
      .filter((category) => category.questions.length > 0);
  }, [search, activeCategory]);

  return (
    <main className="relative min-h-[calc(100svh-81px)] overflow-hidden bg-background px-3 pt-[30px] pb-[60px] text-foreground min-[601px]:px-5 min-[601px]:pt-[42px] min-[601px]:pb-20">

      <section className="relative mx-auto w-full max-w-[1120px] px-1 pt-1 pb-[38px] text-center min-[601px]:px-2.5 [&_h1]:m-0 [&_h1]:font-sans [&_h1]:text-[clamp(38px,13vw,58px)] [&_h1]:leading-none [&_h1]:font-black [&_h1]:tracking-[-0.04em] min-[601px]:[&_h1]:text-[clamp(40px,6vw,70px)] [&_em]:text-primary [&_em]:not-italic">
        <Link href="/" className="inline-flex items-center gap-2 rounded-sm text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para a Home
        </Link>

        <div className="mx-auto mt-[26px] mb-[18px] h-[54px] w-[170px] [&_img]:size-full [&_img]:object-contain">
          <img src="/CineAstra.png" alt="CineAstra" />
        </div>

        <p className="mb-[7px] block text-[10px] font-black tracking-[0.16em] text-primary uppercase">Central de atendimento</p>
        <h1>Como podemos<br /><em>te ajudar?</em></h1>
        <p className="mx-auto mt-[18px] mb-[27px] max-w-[590px] text-[13px] leading-relaxed text-muted-foreground min-[601px]:text-sm">
          Encontre respostas para as principais dúvidas sobre ingressos,
          sessões, sua conta e tudo o que envolve sua experiência CineAstra.
        </p>

        <div className="relative mx-auto flex h-[53px] w-full max-w-[690px] items-center min-[601px]:h-[58px]">
          <Search size={20} className="pointer-events-none absolute left-4 z-10 text-muted-foreground" aria-hidden="true" />
          <Input
            className="h-full rounded-[10px] border-border bg-card pr-12 pl-12 text-base shadow-none md:text-sm dark:bg-card"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Digite uma dúvida, como “cancelamento”..."
            aria-label="Pesquisar dúvidas"
          />
          {search && (
            <Button type="button" variant="ghost" size="icon" className="absolute right-2 size-9 rounded-full text-muted-foreground" onClick={() => setSearch("")} aria-label="Limpar pesquisa">
              <X size={18} aria-hidden="true" />
            </Button>
          )}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-[1120px] overflow-hidden rounded-2xl border border-border bg-card before:pointer-events-none before:absolute before:top-[180px] before:-left-[13px] before:z-10 before:size-6 before:-translate-y-1/2 before:rounded-full before:border before:border-border before:bg-background before:[clip-path:inset(0_0_0_50%)] before:content-[''] after:pointer-events-none after:absolute after:top-[180px] after:-right-[13px] after:z-10 after:size-6 after:-translate-y-1/2 after:rounded-full after:border after:border-border after:bg-background after:[clip-path:inset(0_50%_0_0)] after:content-['']">
        <div className="flex items-center justify-between gap-5 border-b border-dashed border-border px-5 pt-6 pb-5 min-[601px]:px-[34px] min-[601px]:pt-[30px] min-[601px]:pb-6 [&_h2]:text-[clamp(24px,3vw,32px)] [&_h2]:leading-tight [&_h2]:font-bold [&_h2]:tracking-[-0.04em]">
          <div>
            <span className="mb-[7px] block text-[10px] font-black tracking-[0.16em] text-primary uppercase">Central CineAstra</span>
            <h2>Principais dúvidas</h2>
          </div>
          <div className="hidden -rotate-2 items-center gap-[7px] rounded-md border border-dashed border-primary/55 px-[11px] py-2 text-[10px] font-black tracking-[0.13em] text-primary min-[601px]:inline-flex">
            <CircleHelp size={15} aria-hidden="true" />
            FAQ
          </div>
        </div>

        <div className="flex gap-[7px] overflow-x-auto border-b border-border px-5 py-3.5 [scrollbar-width:thin] min-[601px]:px-[34px] min-[601px]:py-[18px]" role="group" aria-label="Categorias de suporte">
          <Button
            type="button"
            aria-pressed={activeCategory === "todos"}
            variant={activeCategory === "todos" ? "default" : "outline"}
            className="h-9 shrink-0 gap-[7px] rounded-[7px] px-3 text-xs font-bold shadow-none"
            onClick={() => setActiveCategory("todos")}
          >
            Todas
          </Button>
          {categories.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              aria-pressed={activeCategory === id}
              variant={activeCategory === id ? "default" : "outline"}
            className="h-9 shrink-0 gap-[7px] rounded-[7px] px-3 text-xs font-bold shadow-none"
              onClick={() => setActiveCategory(id)}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 min-[851px]:grid-cols-2">
          {filteredCategories.map((category) => {
            const Icon = category.icon;

            return (
              <section className="min-w-0 border-dashed border-border px-5 pt-[25px] pb-7 [&:nth-child(n+2)]:border-t min-[601px]:px-[34px] min-[601px]:pt-[30px] min-[601px]:pb-[34px] min-[851px]:odd:border-r min-[851px]:[&:nth-child(2)]:border-t-0" key={category.id}>
                <div className="mb-4 flex items-center gap-3 [&_h3]:text-[17px] [&_h3]:font-bold [&_h3]:tracking-[-0.02em] [&>div>span]:mb-0.5 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:font-bold [&>div>span]:tracking-[0.09em] [&>div>span]:text-muted-foreground [&>div>span]:uppercase">
                  <span className="grid size-[39px] shrink-0 place-items-center rounded-[9px_4px_9px_4px] bg-primary/10 text-primary">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <span>{category.questions.length} {category.questions.length === 1 ? "pergunta" : "perguntas"}</span>
                    <h3>{category.label}</h3>
                  </div>
                </div>

                <Accordion className="border-t border-border" value={openQuestion.startsWith(`${category.id}-`) ? [openQuestion] : []} onValueChange={(values) => setOpenQuestion(values[0] ?? "")}>
                  {category.questions.map((item) => {
                    const questionId = `${category.id}-${categories.find((entry) => entry.id === category.id).questions.indexOf(item)}`;

                    return (
                      <AccordionItem key={questionId} value={questionId} className="border-b border-border last:border-b">
                        <AccordionTrigger className="gap-4 py-4 text-left text-xs leading-relaxed font-bold text-foreground hover:text-primary hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="pr-8 pb-[17px] text-xs leading-relaxed text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </section>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="grid justify-items-center px-[25px] py-[70px] text-center text-muted-foreground [&_h3]:mt-3.5 [&_h3]:mb-[5px] [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_p]:mb-[17px] [&_p]:text-xs">
            <Search size={25} aria-hidden="true" />
            <h3>Não encontramos essa dúvida.</h3>
            <p>Tente pesquisar por outro termo ou escolha uma categoria acima.</p>
            <Button type="button" variant="link" onClick={() => { setSearch(""); setActiveCategory("todos"); }}>
              Ver todas as dúvidas
            </Button>
          </div>
        )}
      </section>

      <section className="relative mx-auto w-full max-w-[1120px] mt-7 grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card min-[851px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]" aria-labelledby="ai-support-title">
        <div className="flex flex-col justify-center gap-[22px] border-b border-dashed border-border bg-primary/5 px-[22px] py-[26px] min-[601px]:p-[34px] min-[851px]:border-r min-[851px]:border-b-0 [&_h2]:max-w-[410px] [&_h2]:text-[clamp(24px,3vw,34px)] [&_h2]:leading-tight [&_h2]:font-bold [&_h2]:tracking-[-0.04em] [&_p]:mt-3 [&_p]:max-w-[440px] [&_p]:text-xs [&_p]:leading-relaxed [&_p]:text-muted-foreground">
          <div>
            <span className="mb-[7px] block text-[10px] font-black tracking-[0.16em] text-primary uppercase">Ainda precisa de ajuda?</span>
            <h2 id="ai-support-title">Converse com a assistente CineAstra</h2>
            <p>
              Não encontrou sua resposta nas dúvidas frequentes? Nossa assistente
              virtual poderá ajudar com outras perguntas sobre o CineAstra.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-[11px] py-2 text-[10px] font-extrabold tracking-wide text-muted-foreground">
            <span className="size-[7px] rounded-full bg-primary" />
            Assistente virtual
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-background p-[22px] min-[601px]:p-[30px]">
          <div className="flex items-start gap-3.5 border-b border-border pb-[23px] min-[601px]:items-center [&_strong]:block [&_strong]:max-w-[390px] [&_strong]:text-sm [&_strong]:leading-normal [&_p]:mt-[5px] [&_p]:text-xs [&_p]:text-muted-foreground">
            <div className="grid size-[55px] shrink-0 place-items-center rounded-[15px_6px_15px_6px] border border-primary/35 bg-primary/10 text-primary" aria-hidden="true">
              <Bot size={25} />
            </div>
            <div>
              <strong>Olá! Eu sou a assistente virtual do CineAstra.</strong>
              <p>Como posso ajudar você hoje?</p>
            </div>
          </div>

          <div className="pt-[22px] pb-5 min-[601px]:pb-6 [&>span]:mb-3 [&>span]:block [&>span]:text-xs [&>span]:font-extrabold [&>span]:tracking-wide [&>span]:text-muted-foreground">
            <span>Perguntas sugeridas</span>
            <div className="grid gap-2">
              <Button type="button" variant="outline" className="h-auto min-h-[42px] w-full justify-between gap-3 rounded-[9px] bg-card px-[13px] py-[9px] text-left text-xs whitespace-normal shadow-none hover:border-primary/55 hover:text-primary">Quais são os filmes em cartaz?<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Button>
              <Button type="button" variant="outline" className="h-auto min-h-[42px] w-full justify-between gap-3 rounded-[9px] bg-card px-[13px] py-[9px] text-left text-xs whitespace-normal shadow-none hover:border-primary/55 hover:text-primary">Como comprar ingressos?<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Button>
              <Button type="button" variant="outline" className="h-auto min-h-[42px] w-full justify-between gap-3 rounded-[9px] bg-card px-[13px] py-[9px] text-left text-xs whitespace-normal shadow-none hover:border-primary/55 hover:text-primary">Quais são os horários das sessões?<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Button>
              <Button type="button" variant="outline" className="h-auto min-h-[42px] w-full justify-between gap-3 rounded-[9px] bg-card px-[13px] py-[9px] text-left text-xs whitespace-normal shadow-none hover:border-primary/55 hover:text-primary">Quais formas de pagamento são aceitas?<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Button>
            </div>
          </div>

          <form className="mt-auto flex items-center gap-2 rounded-full border border-border bg-card p-[7px] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30" onSubmit={(event) => event.preventDefault()}>
            <Input
              className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-base shadow-none focus-visible:ring-0 md:text-sm dark:bg-transparent"
              type="text"
              placeholder="Digite sua dúvida aqui..."
              aria-label="Digite sua dúvida para a assistente virtual"
            />
            <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full shadow-none" aria-label="Enviar dúvida">
              <SendHorizontal size={19} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
