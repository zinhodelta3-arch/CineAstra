"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  ChevronDown,
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
import styles from "./support-center.module.css";

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

function AccordionItem({ question, answer, open, onToggle }) {
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqOpen : ""}`}>
      <button
        type="button"
        className={styles.question}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>{question}</span>
        <span className={styles.chevron}>
          <ChevronDown size={18} aria-hidden="true" />
        </span>
      </button>
      <div className={styles.answer} aria-hidden={!open}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

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
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />

      <section className={styles.hero}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para a Home
        </Link>

        <div className={styles.heroLogo}>
          <img src="/CineAstra.png" alt="CineAstra" />
        </div>

        <p className={styles.eyebrow}>Central de atendimento</p>
        <h1>Como podemos<br /><em>te ajudar?</em></h1>
        <p className={styles.heroText}>
          Encontre respostas para as principais dúvidas sobre ingressos,
          sessões, sua conta e tudo o que envolve sua experiência CineAstra.
        </p>

        <div className={styles.searchBox}>
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Digite uma dúvida, como “cancelamento”..."
            aria-label="Pesquisar dúvidas"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa">
              ×
            </button>
          )}
        </div>
      </section>

      <section className={styles.ticketBoard}>
        <div className={styles.boardHeader}>
          <div>
            <span className={styles.boardKicker}>Central CineAstra</span>
            <h2>Principais dúvidas</h2>
          </div>
          <div className={styles.ticketStamp}>
            <CircleHelp size={15} aria-hidden="true" />
            FAQ
          </div>
        </div>

        <div className={styles.categoryScroller} role="tablist" aria-label="Categorias de suporte">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "todos"}
            className={activeCategory === "todos" ? styles.categoryActive : ""}
            onClick={() => setActiveCategory("todos")}
          >
            Todas
          </button>
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeCategory === id}
              className={activeCategory === id ? styles.categoryActive : ""}
              onClick={() => setActiveCategory(id)}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div className={styles.faqGrid}>
          {filteredCategories.map((category) => {
            const Icon = category.icon;

            return (
              <section className={styles.category} key={category.id}>
                <div className={styles.categoryHeading}>
                  <span className={styles.categoryIcon}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <span>{category.questions.length} {category.questions.length === 1 ? "pergunta" : "perguntas"}</span>
                    <h3>{category.label}</h3>
                  </div>
                </div>

                <div className={styles.questions}>
                  {category.questions.map((item, index) => {
                    const questionId = `${category.id}-${index}`;
                    const open = openQuestion === questionId;

                    return (
                      <AccordionItem
                        key={item.q}
                        question={item.q}
                        answer={item.a}
                        open={open}
                        onToggle={() => setOpenQuestion(open ? "" : questionId)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className={styles.empty}>
            <Search size={25} aria-hidden="true" />
            <h3>Não encontramos essa dúvida.</h3>
            <p>Tente pesquisar por outro termo ou escolha uma categoria acima.</p>
            <button type="button" onClick={() => { setSearch(""); setActiveCategory("todos"); }}>
              Ver todas as dúvidas
            </button>
          </div>
        )}
      </section>

      <section className={styles.aiSupport} aria-labelledby="ai-support-title">
        <div className={styles.aiHeader}>
          <div>
            <span className={styles.boardKicker}>Ainda precisa de ajuda?</span>
            <h2 id="ai-support-title">Converse com a assistente CineAstra</h2>
            <p>
              Não encontrou sua resposta nas dúvidas frequentes? Nossa assistente
              virtual poderá ajudar com outras perguntas sobre o CineAstra.
            </p>
          </div>

          <div className={styles.aiStatus}>
            <span className={styles.statusDot} />
            Assistente virtual
          </div>
        </div>

        <div className={styles.aiChat}>
          <div className={styles.aiIntro}>
            <div className={styles.aiAvatar} aria-hidden="true">
              <Bot size={25} />
            </div>
            <div>
              <strong>Olá! Eu sou a assistente virtual do CineAstra.</strong>
              <p>Como posso ajudar você hoje?</p>
            </div>
          </div>

          <div className={styles.suggestedQuestions}>
            <span>Perguntas sugeridas</span>
            <div className={styles.suggestionList}>
              <button type="button">Quais são os filmes em cartaz?</button>
              <button type="button">Como comprar ingressos?</button>
              <button type="button">Quais são os horários das sessões?</button>
              <button type="button">Quais formas de pagamento são aceitas?</button>
            </div>
          </div>

          <form className={styles.aiComposer} onSubmit={(event) => event.preventDefault()}>
            <input
              type="text"
              placeholder="Digite sua dúvida aqui..."
              aria-label="Digite sua dúvida para a assistente virtual"
            />
            <button type="submit" aria-label="Enviar dúvida">
              <SendHorizontal size={19} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
