"use client";
/*
  CineAstra Stream — Tailwind v4 + shadcn (tokens do tema, claro/escuro)
*/
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import React, { useState, useEffect, useRef, useId } from "react";
import {
  Film, Star, Clock3, Play, ChevronLeft, ChevronRight, ArrowRight,
  Plus, Check, Volume2, Tv2, Crown, Trash2, X, Bookmark, BookmarkCheck,
  Download, Users, MonitorPlay, Ticket, Sparkles, ShieldCheck, Zap,
  Smartphone, Monitor, Tablet, Laptop, Info, Bell, LogOut, Menu, UserRound, CircleHelp
} from "lucide-react";
import { AppearanceSelector } from "@/components/appearance-selector";

/* ============ CABEÇALHO EXCLUSIVO DO STREAMING ============ */
function StreammingHeader({ onLogout, notifications = [] }) {
  const pathname = usePathname() ?? "/streamming";
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigation = [
    { label: "Filmes", href: "/streamming", icon: Film },
    { label: "Minha CineAstra", href: "/streamming/MeuAstra", icon: UserRound },
    { label: "Suporte", href: "/suporte", icon: CircleHelp },
  ];

  const isActive = (href) => {
    if (href === "/streamming") return pathname === "/streamming";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navClass = (active) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 text-foreground backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1800px] items-center justify-between gap-3 px-4 md:px-12">
        <Link
          href="/streamming"
          aria-label="CineAstra Streaming — início"
          className="shrink-0 text-xl font-black tracking-tight sm:text-2xl"
        >
          CINEASTRA<span className="text-primary">.</span>
          <span className="ml-2 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground xl:inline">
            Streaming
          </span>
        </Link>

        <nav aria-label="Navegação do streaming" className="hidden items-center gap-1 lg:flex">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={navClass(isActive(href))}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <div className="relative">
            <button
              type="button"
              aria-label="Notificações"
              aria-expanded={notificationsOpen}
              title="Notificações"
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Bell className="size-5" aria-hidden="true" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" aria-label="Há notificações novas" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full z-[60] mt-2 w-72 rounded-xl border border-border bg-background p-4 text-foreground shadow-xl sm:w-80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-bold">Notificações</h2>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Fechar
                  </button>
                </div>
                {notifications.length ? (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {notifications.map((item, index) => (
                      <div key={item.id ?? index} className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm font-semibold">{item.title ?? item.message ?? "Notificação"}</p>
                        {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-3 text-sm text-muted-foreground">Você não tem notificações novas.</p>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block">
            <AppearanceSelector />
          </div>

          <button
            type="button"
            disabled={!onLogout}
            onClick={() => onLogout?.()}
            title={onLogout ? "Sair da conta" : "Ação de saída ainda não conectada à autenticação"}
            aria-label="Sair da conta"
            className="hidden h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>

          <button
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <nav aria-label="Navegação mobile do streaming" className="flex flex-col gap-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={navClass(isActive(href))}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-border pt-3 sm:hidden">
              <span className="text-sm text-muted-foreground">Tema do aplicativo</span>
              <AppearanceSelector />
            </div>
            <button
              type="button"
              disabled={!onLogout}
              onClick={() => {
                setMenuOpen(false);
                onLogout?.();
              }}
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair da conta
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

/* Texto de destaque que funciona nos dois temas */
const ACCENT = "text-secondary dark:text-primary";

/* ============ DADOS (SOMENTE FILMES) ============ */
const TRAILER = "https://www.youtube.com/embed/dQw4w9WgXcQ";

/*
  Cada filme tem um "motif" (ilustração) e uma paleta ("pal") próprios.
  Para usar imagens reais, basta adicionar `poster`, `thumb` e/ou `backdrop`
  (URLs) ao filme — o componente <Art /> usa a imagem quando ela existir.
*/
const FILMS = [
  { id: "m1", title: "O Último Fotograma", genre: "Suspense", year: 2026, duration: "2h 08min", age: "14", match: 98, cast: "Helena Duarte, Caio Brandão, Marina Lopes", motif: "reel", pal: 5, synopsis: "Um misterioso fotógrafo descobre rolos de filme não revelados em um estúdio abandonado, revelando eventos que reescrevem o passado e ameaçam o futuro." },
  { id: "m2", title: "Constelação Kira", genre: "Ficção Científica", year: 2026, duration: "2h 21min", age: "12", match: 96, cast: "Rafael Menezes, Aiko Tanaka, Lívia Prado", motif: "stars", pal: 9, synopsis: "Uma expedição interestelar parte para investigar um sinal emitido das profundezas de uma nebulosa, onde as leis da física conhecidas não se aplicam." },
  { id: "m3", title: "Maré Vermelha", genre: "Ação", year: 2026, duration: "2h 01min", age: "16", match: 92, cast: "Bruno Castelo, Inês Albuquerque, Davi Torres", motif: "waves", pal: 2, synopsis: "Uma perseguição pelo litoral que ninguém previa terminar assim. Dois ex-parceiros, uma carga perdida e 24 horas até a próxima maré." },
  { id: "m4", title: "Baile das Sombras", genre: "Terror", year: 2025, duration: "1h 54min", age: "16", match: 94, cast: "Valentina Rocha, Otávio Lemos, Carmem Silveira", motif: "mask", pal: 1, synopsis: "Em uma mansão vitoriana isolada, convidados para um baile de máscaras percebem que seus anfitriões pertencem a uma ordem esquecida no tempo." },
  { id: "m5", title: "Sete Invernos", genre: "Drama", year: 2025, duration: "1h 58min", age: "12", match: 91, cast: "Cecília Moraes, Heitor Valente", motif: "mountains", pal: 11, synopsis: "Uma família se reencontra numa casa de montanha para o inverno mais difícil de suas vidas e finalmente fala sobre o que sempre calou." },
  { id: "m6", title: "O Segredo de Gaia", genre: "Animação", year: 2026, duration: "1h 38min", age: "Livre", match: 97, cast: "Vozes de Luna Ribeiro, Theo Fontes", motif: "forest", pal: 8, synopsis: "Uma jovem descobre que a floresta ao redor da sua vila guarda uma memória milenar, e que só ela consegue ouvi-la." },
  { id: "m7", title: "Noite de Estreia", genre: "Comédia", year: 2025, duration: "1h 46min", age: "12", match: 88, cast: "Paula Mendonça, Gustavo Reis, Nina Falcão", motif: "curtain", pal: 2, synopsis: "Na noite de estreia do filme mais esperado do ano, uma equipe desastrada tenta salvar a sessão antes que o público perceba." },
  { id: "m8", title: "Projeção Final", genre: "Suspense", year: 2026, duration: "2h 04min", age: "14", match: 90, cast: "Arthur Lacerda, Bianca Nobre", motif: "beam", pal: 0, synopsis: "Um projecionista aposentado guarda a única cópia de um filme que muita gente poderosa quer ver destruído." },
  { id: "m9", title: "Fogo Cruzado", genre: "Ação", year: 2025, duration: "2h 09min", age: "16", match: 87, cast: "Marcos Vilela, Tereza Quintão", motif: "crosshair", pal: 3, synopsis: "Uma equipe de elite é enviada ao território de duas facções rivais e descobre que a missão nunca foi o que parecia." },
  { id: "m10", title: "Lua de Celuloide", genre: "Drama", year: 2026, duration: "2h 12min", age: "12", match: 93, cast: "Isadora Cabral, Fábio Santanna", motif: "moon", pal: 7, synopsis: "Do cinema mudo ao digital, um casal de projecionistas vive a história de amor que nenhuma tela conseguiu capturar por inteiro." },
  { id: "m11", title: "Último Trem para Aurora", genre: "Aventura", year: 2026, duration: "1h 59min", age: "12", match: 89, cast: "Pedro Camargo, Sofia Linhares", motif: "train", pal: 8, synopsis: "Cinco desconhecidos embarcam no último trem para Aurora e descobrem que o destino muda a cada túnel atravessado." },
  { id: "m12", title: "A Casa dos Ecos", genre: "Terror", year: 2025, duration: "1h 47min", age: "16", match: 86, cast: "Joana Pimentel, Lucas Arruda", motif: "house", pal: 7, synopsis: "Ao se mudar para uma casa isolada, uma família percebe que os ecos nos corredores repetem frases que ainda não foram ditas." },
  { id: "m13", title: "Poeira de Ouro", genre: "Aventura", year: 2026, duration: "2h 15min", age: "14", match: 90, cast: "Ricardo Saldanha, Maya Okafor", motif: "desert", pal: 10, synopsis: "Uma caçadora de recompensas cruza o deserto para entregar um prisioneiro que sabe onde está a maior fortuna do oeste." },
  { id: "m14", title: "Cidade de Vidro", genre: "Ficção Científica", year: 2026, duration: "2h 03min", age: "14", match: 91, cast: "Camila Duarte, Enzo Bittencourt", motif: "city", pal: 6, synopsis: "Numa metrópole onde tudo é visível, uma investigadora procura a única coisa que alguém conseguiu esconder." },
  { id: "m15", title: "Dois Verões", genre: "Comédia", year: 2025, duration: "1h 42min", age: "Livre", match: 85, cast: "Letícia Barros, André Montenegro", motif: "duo", pal: 4, synopsis: "Dois amigos de infância se reencontram em duas temporadas de verão, separadas por dez anos e uma promessa não cumprida." },
  { id: "m16", title: "O Farol", genre: "Suspense", year: 2027, duration: "Em breve", age: "14", match: 0, cast: "Em breve", motif: "lighthouse", pal: 6, soon: true, synopsis: "Um guarda-faroleiro começa a perceber que a luz do farol revela mais do que o mar." },
  { id: "m17", title: "Órbita Zero", genre: "Ficção Científica", year: 2027, duration: "Em breve", age: "12", match: 0, cast: "Em breve", motif: "rocket", pal: 7, soon: true, synopsis: "A tripulação de uma estação em órbita perde contato com a Terra e recebe uma mensagem que ninguém enviou." },
  { id: "m18", title: "Sinfonia Vermelha", genre: "Drama", year: 2027, duration: "Em breve", age: "12", match: 0, cast: "Em breve", motif: "equalizer", pal: 3, soon: true, synopsis: "Na véspera do último concerto, a maestrina precisa decidir se revela a verdade que mantém a orquestra unida." },
  { id: "m19", title: "Neblina", genre: "Terror", year: 2027, duration: "Em breve", age: "16", match: 0, cast: "Em breve", motif: "fog", pal: 11, soon: true, synopsis: "Em uma vila de montanha, toda vez que a neblina desce, um morador deixa de existir na memória dos outros." },
  { id: "m20", title: "Carta ao Mar", genre: "Drama", year: 2027, duration: "Em breve", age: "Livre", match: 0, cast: "Em breve", motif: "boat", pal: 9, soon: true, synopsis: "Uma menina escreve cartas ao mar e, certo dia, uma delas é respondida." },
];

const byId = (ids) => ids.map((id) => FILMS.find((f) => f.id === id)).filter(Boolean);

const HERO_FILMS = byId(["m1", "m2", "m3", "m6"]);
const POPULAR = byId(["m1", "m2", "m6", "m3", "m10", "m14", "m5", "m13"]);
const RECENT = byId(["m3", "m8", "m5", "m14"]);
const PROGRESS = { m3: 40, m8: 75, m5: 20, m14: 90 };
const PREMIERES = byId(["m11", "m12", "m13", "m14", "m15", "m7"]);
const SOON = FILMS.filter((f) => f.soon);
const TOP10 = byId(["m1", "m6", "m2", "m4", "m10", "m5", "m14", "m3", "m11", "m13"]);
const RELEASED = FILMS.filter((f) => !f.soon);
const GENRES = ["Todos", ...Array.from(new Set(RELEASED.map((f) => f.genre)))];

const PLANS = [
  { 
    id: "p-1", 
    title: "Plano Básico", 
    description: "Full HD 1080p · 1 tela por vez · Comum e eficiente", 
    price: 19.9, 
    label: "Para começar", 
    perks: ["Qualidade Full HD 1080p", "1 tela simultânea", "Catálogo de filmes completo", "Áudio Estéreo Surround"], 
    featured: false 
  },
  { 
    id: "p-2", 
    title: "Plano Premium", 
    description: "4K HDR · Dolby Atmos · Combo de 3 telas", 
    price: 32.9, 
    label: "Mais escolhido", 
    perks: ["4K Ultra HD + Dolby Vision", "Dolby Atmos 360° Sound", "3 telas simultâneas", "Downloads offline sem limite"], 
    featured: true 
  },
  { 
    id: "p-3", 
    title: "Plano Família", 
    description: "4K HDR · 5 telas · Perfis individuais & infantis", 
    price: 44.9, 
    label: "Para toda a casa", 
    perks: ["Experiência 4K HDR máxima", "5 telas simultâneas na conta", "Perfis com controle dos pais", "Acesso antecipado a estreias"], 
    featured: false 
  },
];

const formatBRL = (value) => `R$ ${value.toFixed(2).replace(".", ",")}`;

/* ============ ESTILOS ============ */
const CinemaStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');

    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .no-scrollbar { scrollbar-width: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }

    .grain::after {
      content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .05; mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    .perf { height: 14px; background: repeating-linear-gradient(90deg, var(--primary) 0 12px, transparent 12px 26px); opacity: .6; border-radius: 2px; }
    .perf-v { width: 14px; background: repeating-linear-gradient(180deg, var(--border) 0 12px, transparent 12px 26px); opacity: .8; }

    .ticket {
      --n: 68%;
      -webkit-mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
      mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
    }
    .ticket-v {
      --n: 62%;
      -webkit-mask: radial-gradient(circle 11px at var(--n) 0, #0000 97%, #000) top/100% 51% no-repeat, radial-gradient(circle 11px at var(--n) 100%, #0000 97%, #000) bottom/100% 51% no-repeat;
      mask: radial-gradient(circle 11px at var(--n) 0, #0000 97%, #000) top/100% 51% no-repeat, radial-gradient(circle 11px at var(--n) 100%, #0000 97%, #000) bottom/100% 51% no-repeat;
    }

    .tear { border-top: 2px dashed var(--border); }
    .tear-v { border-left: 2px dashed var(--border); }

    .top-num {
      font-family: 'Big Shoulders Display', Impact, sans-serif; font-weight: 900; line-height: .8;
      -webkit-text-stroke: 4px color-mix(in oklab, var(--foreground) 22%, transparent); color: transparent;
    }
  `}</style>
);

/* ============ ILUSTRAÇÕES EXCLUSIVAS DOS PLANOS ============ */
function PlanIllustration({ planId }) {
  if (planId === "p-1") {
    return (
      <div className="relative size-full bg-linear-to-br from-neutral-900 via-neutral-950 to-stone-900 flex items-center justify-center overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)/0.15_0,transparent_70%)]" />
        <div className="relative z-10 w-full max-w-[220px] flex flex-col items-center">
          <div className="w-full aspect-video rounded-lg border-2 border-primary/40 bg-card/90 shadow-2xl backdrop-blur-xs relative overflow-hidden flex flex-col items-center justify-center p-3">
            <div className="absolute inset-0 bg-linear-to-tr from-primary/10 via-transparent to-secondary/20" />
            <Tv2 className="size-10 text-primary mb-1 animate-pulse" />
            <span className="text-[11px] font-black tracking-widest text-foreground uppercase">TELA ÚNICA</span>
            <span className="text-[9px] font-bold text-muted-foreground bg-primary/20 px-2 py-0.5 rounded-full mt-1 border border-primary/30">FULL HD 1080p</span>
          </div>
          <div className="w-12 h-2 bg-primary/60 rounded-b-md" />
          <div className="w-20 h-1 bg-primary/40 rounded-full mt-0.5" />
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
          <Monitor className="size-3.5 text-primary" />
          <span className="text-[10px] font-bold text-white">1 Dispositivo</span>
        </div>
      </div>
    );
  }

  if (planId === "p-2") {
    return (
      <div className="relative size-full bg-linear-to-br from-amber-950/40 via-neutral-900 to-secondary/30 flex items-center justify-center overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary)/0.25_0,transparent_75%)]" />
        <div className="relative z-10 flex items-center justify-center gap-2 w-full max-w-[280px]">
          <div className="w-20 aspect-video rounded-md border border-primary/50 bg-card/90 shadow-lg flex flex-col items-center justify-center p-1 -rotate-6">
            <Laptop className="size-5 text-primary" />
            <span className="text-[8px] font-black text-foreground">NOTEBOOK</span>
          </div>
          <div className="w-32 aspect-video rounded-lg border-2 border-primary bg-background/95 shadow-2xl relative flex flex-col items-center justify-center p-2 z-10">
            <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[7px] font-black px-1 rounded-xs">4K HDR</div>
            <Tv2 className="size-8 text-primary" />
            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-foreground">
              <Volume2 className="size-3 text-secondary dark:text-primary" /> Atmos®
            </div>
          </div>
          <div className="w-10 aspect-9/16 rounded-md border border-primary/50 bg-card/90 shadow-lg flex flex-col items-center justify-center p-1 rotate-6">
            <Smartphone className="size-4 text-primary" />
            <span className="text-[7px] font-bold text-muted-foreground mt-0.5">MOBILE</span>
          </div>
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-black shadow-md">
          <Crown className="size-3" /> COMBO 3 TELAS
        </div>
      </div>
    );
  }

  return (
    <div className="relative size-full bg-linear-to-br from-red-950/40 via-neutral-950 to-neutral-900 flex items-center justify-center overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,var(--secondary)/0.3_0,transparent_70%)]" />
      <div className="relative z-10 flex flex-col items-center w-full max-w-[260px]">
        <div className="flex items-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="size-7 rounded-full bg-secondary/80 border-2 border-primary/60 flex items-center justify-center text-[10px] font-black text-secondary-foreground shadow-md">
              P{i}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1 bg-card/80 border border-border px-2 py-1 rounded-md text-[10px] font-bold text-foreground">
            <Tv2 className="size-3.5 text-primary" /> TV
          </div>
          <div className="flex items-center gap-1 bg-card/80 border border-border px-2 py-1 rounded-md text-[10px] font-bold text-foreground">
            <Tablet className="size-3.5 text-primary" /> Tablet
          </div>
          <div className="flex items-center gap-1 bg-card/80 border border-border px-2 py-1 rounded-md text-[10px] font-bold text-foreground">
            <Smartphone className="size-3.5 text-primary" /> Celular
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-white">
        <Download className="size-3 text-primary" /> Downloads Ilimitados
      </div>
    </div>
  );
}

/* ============ ARTE DE EXEMPLO (FILMES) ============ */
const PALETTES = [
  { bg1: "#353323", bg2: "#14130b", a: "#fad241", b: "#971d00", t: "#ece1dc" }, // 0 dourado
  { bg1: "#7c1029", bg2: "#1b0710", a: "#fad241", b: "#ece1dc", t: "#ece1dc" }, // 1 vinho
  { bg1: "#971d00", bg2: "#2a0d05", a: "#fad241", b: "#ece1dc", t: "#ece1dc" }, // 2 vermelho
  { bg1: "#14130b", bg2: "#353323", a: "#971d00", b: "#fad241", t: "#fad241" }, // 3 noite
  { bg1: "#fad241", bg2: "#971d00", a: "#14130b", b: "#ece1dc", t: "#ece1dc" }, // 4 amarelo
  { bg1: "#ece1dc", bg2: "#7c1029", a: "#14130b", b: "#971d00", t: "#ece1dc" }, // 5 creme
  { bg1: "#0e3b43", bg2: "#061a1e", a: "#f4a259", b: "#5bc0be", t: "#ece1dc" }, // 6 petróleo
  { bg1: "#1b2a49", bg2: "#0b1222", a: "#f6c667", b: "#e4572e", t: "#ece1dc" }, // 7 marinho
  { bg1: "#1f3d2b", bg2: "#0b1a11", a: "#f2e8a0", b: "#7fb069", t: "#f2e8a0" }, // 8 floresta
  { bg1: "#3b1f5c", bg2: "#150a24", a: "#ff8fab", b: "#fad241", t: "#ece1dc" }, // 9 ameixa
  { bg1: "#c8742c", bg2: "#4a1f08", a: "#fbe3b0", b: "#14130b", t: "#fbe3b0" }, // 10 areia
  { bg1: "#cfe3ee", bg2: "#2d4a63", a: "#14202b", b: "#ffffff", t: "#ffffff" }, // 11 gelo
];

const seeded = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return () => (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
};

const wrapTitle = (t) => {
  const lines = [];
  let cur = "";
  for (const w of t.toUpperCase().split(" ")) {
    if ((cur + " " + w).trim().length > 11 && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
};

function Motif({ kind, p, r }) {
  switch (kind) {
    case "sun":
      return (
        <g>
          <circle cx="400" cy="290" r="150" fill={p.a} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="240" y={310 + i * 22} width="320" height={4 + i * 3} fill={p.bg2} />)}
          <rect x="0" y="470" width="800" height="330" fill={p.bg2} opacity=".55" />
        </g>
      );
    case "city":
      return (
        <g>
          <circle cx="570" cy="200" r="70" fill={p.b} opacity=".9" />
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 120 + r() * 260;
            return <rect key={i} x={80 + i * 52} y={560 - h} width="44" height={h} fill={p.a} opacity={0.35 + r() * 0.5} />;
          })}
        </g>
      );
    case "rings":
      return (
        <g fill="none">
          {[250, 200, 150, 100].map((rad, i) => <circle key={rad} cx="400" cy="300" r={rad} stroke={i % 2 ? p.b : p.a} strokeWidth="10" />)}
          <circle cx="400" cy="300" r="48" fill={p.b} />
        </g>
      );
    case "mountains":
      return (
        <g>
          <circle cx="400" cy="230" r="90" fill={p.b} />
          <polygon points="0,560 220,260 400,460 560,230 800,560" fill={p.a} opacity=".55" />
          <polygon points="0,620 180,400 360,540 520,360 800,620" fill={p.bg2} opacity=".85" />
        </g>
      );
    case "stripes":
      return (
        <g transform="rotate(-18 400 300)">
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x="-100" y={40 + i * 60} width="1000" height={i % 2 ? 10 : 26} fill={i % 3 === 0 ? p.b : p.a} opacity=".85" />
          ))}
        </g>
      );
    case "eye":
      return (
        <g>
          <path d="M120 300 Q400 90 680 300 Q400 510 120 300Z" fill="none" stroke={p.a} strokeWidth="12" />
          <circle cx="400" cy="300" r="95" fill={p.b} />
          <circle cx="400" cy="300" r="42" fill={p.bg2} />
        </g>
      );
    case "stars":
      return (
        <g>
          {Array.from({ length: 70 }).map((_, i) => <circle key={i} cx={r() * 800} cy={r() * 600} r={1 + r() * 3} fill={p.b} opacity={0.4 + r() * 0.6} />)}
          <circle cx="400" cy="290" r="110" fill={p.a} />
          <ellipse cx="400" cy="290" rx="230" ry="46" fill="none" stroke={p.b} strokeWidth="9" transform="rotate(-16 400 290)" />
        </g>
      );
    case "door":
      return (
        <g>
          <polygon points="335,560 465,560 580,640 220,640" fill={p.a} opacity=".3" />
          <path d="M290 560 V300 A110 110 0 0 1 510 300 V560 Z" fill={p.a} opacity=".9" />
          <path d="M330 560 V305 A70 70 0 0 1 470 305 V560 Z" fill={p.bg2} />
        </g>
      );

    /* ---- novos motivos ---- */
    case "reel":
      return (
        <g>
          <circle cx="400" cy="290" r="210" fill="none" stroke={p.a} strokeWidth="14" />
          <circle cx="400" cy="290" r="60" fill={p.b} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const ang = (i * 60 * Math.PI) / 180;
            return <circle key={i} cx={400 + Math.cos(ang) * 125} cy={290 + Math.sin(ang) * 125} r="38" fill={p.bg2} stroke={p.a} strokeWidth="6" />;
          })}
        </g>
      );
    case "mask":
      return (
        <g>
          <path d="M190 190 Q400 100 610 190 Q640 430 400 550 Q160 430 190 190Z" fill={p.a} />
          <path d="M260 270 Q330 230 375 300 Q320 335 260 270Z" fill={p.bg2} />
          <path d="M540 270 Q470 230 425 300 Q480 335 540 270Z" fill={p.bg2} />
          <path d="M290 410 Q400 490 510 410 Q400 445 290 410Z" fill={p.b} />
        </g>
      );
    case "forest":
      return (
        <g>
          <circle cx="400" cy="200" r="95" fill={p.a} />
          {Array.from({ length: 9 }).map((_, i) => {
            const x = 40 + i * 85;
            const h = 190 + r() * 170;
            return <polygon key={i} points={`${x},570 ${x + 48},${570 - h} ${x + 96},570`} fill={i % 2 ? p.bg2 : p.b} opacity=".88" />;
          })}
        </g>
      );
    case "curtain":
      return (
        <g>
          <polygon points="360,0 440,0 650,560 150,560" fill={p.a} opacity=".3" />
          <path d="M0 0 H310 Q240 280 285 570 H0Z" fill={p.b} />
          <path d="M800 0 H490 Q560 280 515 570 H800Z" fill={p.b} />
          <path d="M0 0 H310 Q270 280 300 570 H260 Q215 280 270 0Z" fill={p.bg2} opacity=".35" />
          <ellipse cx="400" cy="560" rx="230" ry="30" fill={p.a} opacity=".7" />
        </g>
      );
    case "beam":
      return (
        <g>
          <polygon points="150,280 740,60 740,520" fill={p.a} opacity=".38" />
          <rect x="735" y="50" width="26" height="480" fill={p.b} />
          <rect x="50" y="245" width="110" height="80" rx="8" fill={p.a} />
          <circle cx="80" cy="212" r="32" fill="none" stroke={p.a} strokeWidth="8" />
          <circle cx="135" cy="212" r="32" fill="none" stroke={p.a} strokeWidth="8" />
        </g>
      );
    case "crosshair":
      return (
        <g fill="none" strokeLinecap="round">
          <circle cx="400" cy="290" r="190" stroke={p.a} strokeWidth="10" />
          <circle cx="400" cy="290" r="100" stroke={p.b} strokeWidth="8" />
          <line x1="400" y1="50" x2="400" y2="190" stroke={p.a} strokeWidth="10" />
          <line x1="400" y1="390" x2="400" y2="530" stroke={p.a} strokeWidth="10" />
          <line x1="160" y1="290" x2="300" y2="290" stroke={p.a} strokeWidth="10" />
          <line x1="500" y1="290" x2="640" y2="290" stroke={p.a} strokeWidth="10" />
          <circle cx="400" cy="290" r="14" fill={p.b} stroke="none" />
        </g>
      );
    case "moon":
      return (
        <g>
          {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={r() * 800} cy={r() * 400} r={1 + r() * 2.5} fill={p.b} opacity={0.4 + r() * 0.6} />)}
          <circle cx="400" cy="250" r="170" fill={p.a} />
          <circle cx="485" cy="205" r="150" fill={p.bg1} />
          <rect x="0" y="440" width="800" height="76" fill={p.bg2} opacity=".85" />
          {Array.from({ length: 14 }).map((_, i) => (
            <g key={i}>
              <rect x={14 + i * 58} y="450" width="30" height="14" rx="3" fill={p.a} />
              <rect x={14 + i * 58} y="492" width="30" height="14" rx="3" fill={p.a} />
            </g>
          ))}
        </g>
      );
    case "train":
      return (
        <g>
          <circle cx="400" cy="215" r="115" fill={p.b} />
          <polygon points="345,325 455,325 650,570 150,570" fill={p.bg2} opacity=".85" />
          <line x1="365" y1="325" x2="235" y2="570" stroke={p.a} strokeWidth="10" />
          <line x1="435" y1="325" x2="565" y2="570" stroke={p.a} strokeWidth="10" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const half = 40 + i * 30;
            return <rect key={i} x={400 - half} y={350 + i * 36} width={half * 2} height={7 + i * 2} fill={p.a} opacity=".7" />;
          })}
        </g>
      );
    case "house":
      return (
        <g>
          {[250, 310, 370].map((rad, i) => <circle key={rad} cx="400" cy="320" r={rad} fill="none" stroke={p.b} strokeWidth="6" opacity={0.6 - i * 0.15} />)}
          <polygon points="400,130 625,305 175,305" fill={p.a} />
          <rect x="225" y="305" width="350" height="250" fill={p.a} opacity=".92" />
          <rect x="362" y="410" width="76" height="145" fill={p.bg2} />
          <rect x="268" y="345" width="62" height="62" fill={p.bg2} />
          <rect x="470" y="345" width="62" height="62" fill={p.bg2} />
        </g>
      );
    case "desert":
      return (
        <g>
          <circle cx="540" cy="215" r="105" fill={p.b} />
          <path d="M0 470 Q200 340 400 455 T800 430 V570 H0Z" fill={p.a} opacity=".85" />
          <path d="M0 530 Q250 430 500 530 T800 510 V600 H0Z" fill={p.bg2} opacity=".8" />
          <rect x="195" y="345" width="26" height="130" rx="13" fill={p.bg2} />
          <path d="M208 410 h-38 v-52" stroke={p.bg2} strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M208 390 h38 v-44" stroke={p.bg2} strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "duo":
      return (
        <g>
          <circle cx="325" cy="250" r="145" fill={p.a} />
          <circle cx="475" cy="250" r="145" fill={p.b} opacity=".82" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x="120" y={445 + i * 30} width="560" height={6 + i * 2} rx="4" fill={p.bg2} opacity={0.8 - i * 0.12} />)}
        </g>
      );
    case "lighthouse": {
      const L = (y) => 372 - ((y - 200) * 22) / 340;
      const R = (y) => 428 + ((y - 200) * 22) / 340;
      return (
        <g>
          <polygon points="420,150 800,50 800,300" fill={p.a} opacity=".35" />
          <polygon points="380,150 0,50 0,300" fill={p.a} opacity=".35" />
          <circle cx="400" cy="180" r="70" fill={p.a} opacity=".3" />
          <polygon points="350,545 450,545 428,200 372,200" fill={p.a} />
          {[[270, 330], [400, 460]].map(([y1, y2]) => (
            <polygon key={y1} points={`${L(y1)},${y1} ${R(y1)},${y1} ${R(y2)},${y2} ${L(y2)},${y2}`} fill={p.b} />
          ))}
          <rect x="374" y="158" width="52" height="42" fill={p.b} />
          <polygon points="364,158 436,158 400,118" fill={p.bg2} />
          <rect x="0" y="545" width="800" height="60" fill={p.bg2} opacity=".75" />
        </g>
      );
    }
    case "rocket":
      return (
        <g>
          {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={r() * 800} cy={r() * 560} r={1 + r() * 2.5} fill={p.b} opacity={0.3 + r() * 0.6} />)}
          <ellipse cx="400" cy="300" rx="310" ry="62" fill="none" stroke={p.a} strokeWidth="6" opacity=".6" transform="rotate(-20 400 300)" />
          <polygon points="335,365 245,480 335,445" fill={p.b} />
          <polygon points="465,365 555,480 465,445" fill={p.b} />
          <path d="M360 440 Q400 590 440 440Z" fill={p.b} opacity=".9" />
          <ellipse cx="400" cy="280" rx="72" ry="170" fill={p.a} />
          <path d="M330 255 Q400 30 470 255Z" fill={p.b} />
          <circle cx="400" cy="270" r="34" fill={p.bg2} stroke={p.b} strokeWidth="8" />
        </g>
      );
    case "equalizer":
      return (
        <g>
          {Array.from({ length: 17 }).map((_, i) => {
            const h = 40 + (Math.sin(i * 0.7) + 1) * 70 + r() * 40;
            return <rect key={i} x={92 + i * 38} y={300 - h} width="26" height={h * 2} rx="13" fill={i % 2 ? p.b : p.a} opacity=".92" />;
          })}
        </g>
      );
    case "fog":
      return (
        <g>
          <circle cx="400" cy="195" r="85" fill={p.a} opacity=".75" />
          <polygon points="0,545 150,300 280,460 420,255 600,470 720,335 800,430 800,570 0,570" fill={p.bg2} opacity=".9" />
          {[320, 392, 466].map((y, i) => <rect key={y} x={i % 2 ? 60 : -40} y={y} width="780" height="46" rx="23" fill={p.t} opacity=".2" />)}
        </g>
      );
    case "boat":
      return (
        <g>
          <circle cx="570" cy="165" r="72" fill={p.a} />
          <polygon points="404,335 404,150 535,335" fill={p.t} opacity=".92" />
          <polygon points="392,335 392,215 295,335" fill={p.a} />
          <polygon points="268,335 540,335 478,398 330,398" fill={p.b} />
          {[0, 1, 2, 3].map((i) => {
            const y = 385 + i * 44;
            return <path key={i} d={`M0 ${y} Q100 ${y - 38} 200 ${y} T400 ${y} T600 ${y} T800 ${y}`} fill="none" stroke={p.a} strokeWidth="8" opacity={0.95 - i * 0.15} />;
          })}
        </g>
      );

    case "waves":
    default:
      return (
        <g>
          <circle cx="400" cy="230" r="100" fill={p.b} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const y = 340 + i * 36;
            return <path key={i} d={`M0 ${y} Q100 ${y - 40} 200 ${y} T400 ${y} T600 ${y} T800 ${y}`} fill="none" stroke={p.a} strokeWidth="8" opacity={1 - i * 0.12} />;
          })}
        </g>
      );
  }
}

function FilmArt({ movie, showTitle = true, className = "" }) {
  const id = useId().replace(/:/g, "");
  const p = PALETTES[movie.pal % PALETTES.length];
  const r = seeded(movie.id);
  const lines = wrapTitle(movie.title);
  const maxLen = Math.max(...lines.map((l) => l.length));
  const size = Math.min(120, Math.max(56, 520 / (maxLen * 0.5)));
  const lh = size * 0.9;
  const lastY = 600;

  return (
    <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Arte de ${movie.title}`}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg1} /><stop offset="1" stopColor={p.bg2} />
        </linearGradient>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".4" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".75" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill={`url(#${id}-bg)`} />
      <Motif kind={movie.motif} p={p} r={r} />
      {showTitle && (
        <>
          <rect width="800" height="800" fill={`url(#${id}-sh)`} />
          {lines.map((line, i) => (
            <text key={i} x="400" y={lastY - (lines.length - 1 - i) * lh} textAnchor="middle" fontFamily="'Big Shoulders Display', Impact, sans-serif" fontWeight="900" fontSize={size} fill={p.t}>
              {line}
            </text>
          ))}
        </>
      )}
    </svg>
  );
}

function Art({ movie, variant = "thumb", showTitle = true, className = "size-full object-cover" }) {
  const src = variant === "poster" ? movie.poster : variant === "backdrop" ? movie.backdrop : movie.thumb;
  if (src) return <img src={src} alt={`Arte de ${movie.title}`} className={className} />;
  return <FilmArt movie={movie} showTitle={showTitle && variant !== "backdrop"} className={className} />;
}

/* ============ COMPONENTES AUXILIARES ============ */
const Barcode = ({ seed = 7 }) => (
  <div className="flex items-end gap-[2px] h-10" aria-hidden="true">
    {Array.from({ length: 34 }).map((_, i) => (
      <span key={i} className="bg-foreground/70" style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
    ))}
  </div>
);

function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}

function Button({ children, variant = "default", size = "default", className = "", type = "button", ...props }) {
  let base = "inline-flex items-center justify-center font-bold transition-all rounded-full cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 disabled:cursor-not-allowed ";

  if (variant === "default") base += "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 ";
  if (variant === "wine") base += "bg-secondary text-secondary-foreground hover:opacity-90 ";
  if (variant === "outline") base += "border border-border bg-background/50 text-foreground hover:border-primary hover:text-secondary dark:hover:text-primary ";
  if (variant === "ghost") base += "text-muted-foreground hover:text-foreground hover:bg-muted/50 ";
  if (variant === "link") base += `${ACCENT} hover:underline p-0 h-auto `;

  if (size === "sm") base += "px-3 py-1.5 text-xs ";
  if (size === "default") base += "px-6 py-3 text-sm ";
  if (size === "lg") base += "px-8 py-4 text-base ";
  if (size === "icon") base += "p-2.5 ";

  return <button type={type} className={`${base} ${className}`} {...props}>{children}</button>;
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-10 flex items-start gap-4">
      <div className="hidden sm:block perf-v self-stretch rounded-xs" aria-hidden="true" />
      <div>
        <div className={`flex items-center gap-2 text-sm font-semibold ${ACCENT} mb-1`}>
          <Film className="size-4" aria-hidden="true" /> {eyebrow}
        </div>
        <h2 className="f-display text-5xl md:text-7xl font-black text-foreground leading-[0.95]">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

function Row({ title, children, className = "" }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.85), behavior: "smooth" });

  /* Setas discretas: pequenas, translúcidas, só aparecem ao passar o mouse na fileira */
  const arrowBase =
    "absolute inset-y-0 w-10 z-30 hidden sm:flex items-center justify-center opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity text-foreground/35 hover:text-foreground/80 outline-hidden";

  return (
    <section className={`group/row relative max-w-[1800px] mx-auto px-5 md:px-12 py-3 md:py-5 ${className}`}>
      <h2 className="f-display text-3xl md:text-4xl font-black text-foreground mb-3 flex items-center gap-2">
        <Ticket className={`size-5 ${ACCENT}`} aria-hidden="true" /> {title}
      </h2>
      <div className="relative">
        <button type="button" aria-label="Rolar para a esquerda" onClick={() => scroll(-1)} className={`${arrowBase} left-0 bg-linear-to-r from-background/40 to-transparent`}>
          <ChevronLeft className="size-6" strokeWidth={1.5} />
        </button>
        {/* overflow-y-hidden evita a barra de rolagem vertical (ex.: no Top 10) */}
        <div ref={ref} className="no-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x py-3">{children}</div>
        <button type="button" aria-label="Rolar para a direita" onClick={() => scroll(1)} className={`${arrowBase} right-0 bg-linear-to-l from-background/40 to-transparent`}>
          <ChevronRight className="size-6" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}

/* ============ HERO ============ */
function HeroArrow({ dir, onClick }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Filme anterior" : "Próximo filme"}
      className={`absolute top-1/2 -translate-y-1/2 z-30 hidden sm:flex size-8 items-center justify-center rounded-full border border-foreground/10 bg-transparent text-foreground/30 transition-all hover:bg-background/50 hover:text-foreground/80 hover:border-foreground/30 outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:text-foreground/80 ${dir === "prev" ? "left-1 md:left-2" : "right-1 md:right-2"}`}
    >
      <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

function HeroSection({ onPlay, onSelect, myList, onToggleList }) {
  const [cur, setCur] = useState(0);
  const total = HERO_FILMS.length;
  const go = (d) => setCur((p) => (p + d + total) % total);

  useEffect(() => {
    const t = setTimeout(() => setCur((p) => (p + 1) % total), 9000);
    return () => clearTimeout(t);
  }, [cur, total]);

  const movie = HERO_FILMS[cur];
  const inList = myList.some((i) => i.id === movie.id);

  return (
    <section id="hero" aria-roledescription="carrossel" className="grain relative min-h-[90vh] bg-background flex items-center pt-28 pb-40 overflow-hidden">
      {HERO_FILMS.map((m, i) => (
        <div key={m.id} aria-hidden={i !== cur} className={`absolute inset-y-0 right-0 w-full lg:w-[78%] transition-opacity duration-1000 ${i === cur ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <Art movie={m} variant="backdrop" className="absolute inset-0 size-full object-cover" />
        </div>
      ))}
      <div className="absolute inset-0 z-10 bg-linear-to-r from-background via-background/85 to-transparent" />
      <div className="absolute inset-0 z-10 bg-linear-to-t from-background via-transparent to-background/60" />

      <Image
        src="/Logominimalista.png"
        alt=""
        aria-hidden="true"
        width={200}
        height={260}
        priority
        className="pointer-events-none absolute top-24 right-[2%] z-10 hidden h-auto w-28 opacity-20 md:block md:w-36"
      />

      <div className="perf absolute top-0 inset-x-0 z-20" aria-hidden="true" />

      <HeroArrow dir="prev" onClick={() => go(-1)} />
      <HeroArrow dir="next" onClick={() => go(1)} />

      <div className="relative z-20 max-w-[1800px] mx-auto px-5 md:px-12 w-full">
        <div className="max-w-2xl" aria-live="polite">
          <div className="f-display text-xl tracking-[0.2em] text-foreground/90 mb-1">
            <span className={`${ACCENT} font-black`}>CINEASTRA</span> ORIGINAL
          </div>
          <h1 className="f-display text-6xl sm:text-7xl lg:text-[8rem] font-black text-foreground uppercase leading-[0.85] mb-5">{movie.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-5 flex-wrap">
            <span className={`font-bold ${ACCENT}`}>{movie.match}% relevante</span>
            <span>{movie.year}</span>
            <span>{movie.duration}</span>
            <span className="px-1.5 py-0.5 rounded-xs border border-muted-foreground/60 text-[11px] font-bold">4K Ultra HD</span>
            <span className="px-1.5 py-0.5 rounded-xs border border-muted-foreground/60 text-[11px] font-bold">5.1</span>
          </div>
          <p className="text-base md:text-lg text-foreground/80 max-w-xl mb-5 line-clamp-3 leading-relaxed">{movie.synopsis}</p>
          <p className="text-sm italic text-muted-foreground mb-8">
            {movie.cast}<br />Filmes · {movie.genre}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="lg" onClick={() => onPlay(movie)}><Play className="size-5 mr-2 fill-current" aria-hidden="true" /> Assistir</Button>
            <Button size="lg" variant="outline" onClick={() => onToggleList(movie)}>
              {inList ? <BookmarkCheck className="size-5 mr-2" aria-hidden="true" /> : <Plus className="size-5 mr-2" aria-hidden="true" />}
              {inList ? "Na minha lista" : "Minha lista"}
            </Button>
            <Button size="lg" variant="ghost" onClick={() => onSelect(movie)}><Info className="size-5 mr-2" aria-hidden="true" /> Mais informações</Button>
          </div>
        </div>
      </div>

      <div className="absolute z-20 bottom-40 right-0 flex items-center gap-4">
        <div className="flex gap-2">
          {HERO_FILMS.map((m, i) => (
            <button key={m.id} type="button" aria-label={`Ir para ${m.title}`} aria-current={i === cur} onClick={() => setCur(i)} className={`h-1.5 rounded-full transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${i === cur ? "w-8 bg-primary" : "w-4 bg-foreground/30 hover:bg-foreground/60"}`} />
          ))}
        </div>
        <div className="bg-background/60 border-l-4 border-foreground/70 pl-3 pr-8 py-1.5 text-sm font-bold text-foreground">
          {movie.age === "Livre" ? "Livre" : movie.age}
        </div>
      </div>
    </section>
  );
}

/* ============ CARDS ============ */
function Thumb({ movie, onSelect, onPlay, inList, onToggleList, progress }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(movie)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(movie))}
      aria-label={movie.title}
      className="group snap-start shrink-0 relative w-[250px] md:w-[330px] aspect-video rounded-md overflow-hidden bg-card border border-border cursor-pointer transition-all duration-300 hover:scale-[1.05] hover:z-20 hover:border-primary hover:shadow-2xl hover:shadow-black/60 focus-visible:ring-2 focus-visible:ring-primary outline-hidden"
    >
      <Art movie={movie} variant="thumb" className="absolute inset-0 size-full object-cover" />
      <span className="absolute top-2 left-2 f-display text-[13px] font-black tracking-[0.18em] text-primary bg-black/60 px-1.5 rounded-xs leading-tight">CINEASTRA</span>
      {movie.soon && <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">Em breve</Badge>}

      <div className="absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-background via-background/70 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 mb-1.5">
          {!movie.soon && (
            <button type="button" aria-label={`Assistir ${movie.title}`} onClick={(e) => { e.stopPropagation(); onPlay(movie); }} className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90">
              <Play className="size-4 fill-current" />
            </button>
          )}
          <button type="button" aria-label={inList ? "Remover da lista" : "Adicionar à lista"} onClick={(e) => { e.stopPropagation(); onToggleList(movie); }} className="size-9 rounded-full border-2 border-foreground/60 text-foreground flex items-center justify-center hover:border-primary">
            {inList ? <Check className="size-4" /> : <Plus className="size-4" />}
          </button>
        </div>
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-2 flex-wrap">
          {!movie.soon && <span className={ACCENT}>{movie.match}% relevante</span>}
          <span className="px-1 border border-muted-foreground/60 rounded-xs">{movie.age}</span>
          <span>{movie.duration}</span>
          <span className="text-muted-foreground">{movie.genre}</span>
        </p>
      </div>

      {progress != null && (
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-background/70" aria-label={`${progress}% assistido`}>
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function Top10Card({ movie, rank, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(movie)} className="group snap-start shrink-0 flex items-end overflow-hidden outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg" aria-label={`${rank}º ${movie.title}`}>
      <span className="top-num text-[11rem] md:text-[14rem] -mr-8 relative z-0 select-none transition-colors group-hover:[-webkit-text-stroke-color:var(--primary)]" aria-hidden="true">{rank}</span>
      <span className="relative z-10 block w-32 md:w-40 aspect-[2/3] overflow-hidden rounded-md border border-border transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20">
        <Art movie={movie} variant="poster" className="size-full object-cover" />
      </span>
    </button>
  );
}

function PosterTile({ movie, onSelect, inList }) {
  return (
    <button type="button" onClick={() => onSelect(movie)} aria-label={movie.title} className="group relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-card transition-all duration-300 hover:scale-[1.05] hover:z-10 hover:border-primary hover:shadow-xl hover:shadow-black/60 outline-hidden focus-visible:ring-2 focus-visible:ring-primary">
      <Art movie={movie} variant="poster" className="absolute inset-0 size-full object-cover" />
      <span className="absolute top-1.5 left-1.5 f-display text-[11px] font-black tracking-[0.18em] text-primary bg-black/60 px-1 rounded-xs leading-tight">CINEASTRA</span>
      {inList && <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="size-3" /></span>}
      <span className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-background to-transparent text-left opacity-0 group-hover:opacity-100 transition-opacity">
        <span className={`block text-[11px] font-semibold ${ACCENT}`}>{movie.genre}</span>
        <span className="block text-[11px] text-foreground">{movie.duration} · {movie.age}</span>
      </span>
    </button>
  );
}

/* ============ SEÇÃO DE PLANOS (COM ILUSTRAÇÕES EXCLUSIVAS) ============ */
function PlansSection({ onSelectPlan }) {
  return (
    <section id="planos" className="py-20 bg-background border-t border-border">
      <div className="max-w-[1800px] mx-auto px-5 md:px-12">
        <SectionTitle 
          eyebrow="Assinatura & Combos" 
          title="Escolha o seu plano" 
          description="Qualidade de cinema, combos de telas e benefícios para toda a sua família. Cancele quando quiser." 
        />
        
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((p) => (
            <div 
              key={p.id} 
              className={`ticket ticket-v [--n:50%] group border flex flex-col transition-all duration-300 hover:-translate-y-2.5 hover:shadow-2xl ${
                p.featured ? "bg-secondary/20 border-primary/70 shadow-primary/10" : "bg-card border-border"
              }`}
            >
              <div className="relative aspect-video overflow-hidden border-b border-border">
                <PlanIllustration planId={p.id} />
                <Badge className={`absolute top-3 right-3 border border-primary/30 ${p.featured ? "bg-primary text-primary-foreground font-black" : "bg-secondary text-secondary-foreground"}`}>
                  {p.label}
                </Badge>
              </div>

              <div className="p-6 grow flex flex-col justify-between">
                <div>
                  <h3 className="f-display text-4xl font-black text-card-foreground mb-1">{p.title}</h3>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{p.description}</p>

                  <ul className="space-y-3 mb-6">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2.5 text-sm text-card-foreground">
                        <Check className={`size-4 shrink-0 ${ACCENT}`} aria-hidden="true" /> 
                        <span className="font-medium">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="tear mx-6" />

              <div className="p-6 flex items-center justify-between bg-muted/20">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Valor mensal</span>
                  <span className={`f-display text-4xl font-black ${ACCENT}`}>{formatBRL(p.price)}</span>
                </div>
                <Button variant={p.featured ? "default" : "wine"} size="sm" onClick={() => onSelectPlan(p)}>
                  Assinar Agora
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mt-12 p-6 rounded-2xl bg-card/60 border border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <Download className="size-5" aria-hidden="true" />
            </div>
            <div>
              <strong className="block text-foreground text-xs font-bold uppercase">Modo Offline</strong>
              <span>Baixe e assista filmes onde e quando quiser</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <Users className="size-5" aria-hidden="true" />
            </div>
            <div>
              <strong className="block text-foreground text-xs font-bold uppercase">Perfis da Família</strong>
              <span>Controle dos pais e recomendações individuais</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <MonitorPlay className="size-5" aria-hidden="true" />
            </div>
            <div>
              <strong className="block text-foreground text-xs font-bold uppercase">Multi-Dispositivos</strong>
              <span>Smart TVs, Celulares, Tablets e Navegadores</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ MODAIS ============ */
function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

function PlayerModal({ movie, onClose }) {
  useEscape(onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label={`Assistindo ${movie.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className={`text-xs font-semibold ${ACCENT} block`}>Reproduzindo</span>
            <h3 className="f-display text-3xl font-black text-foreground">{movie.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-muted-foreground hover:text-foreground rounded-full"><X className="size-6" /></button>
        </div>
        <div className="flex gap-2 bg-card p-3 rounded-md border border-border">
          <div className="perf-v hidden sm:block rounded-xs" aria-hidden="true" />
          <div className="aspect-video w-full bg-black">
            <iframe src={`${TRAILER}?autoplay=1`} title={movie.title} className="size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          <div className="perf-v hidden sm:block rounded-xs" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function DetailsModal({ movie, onClose, onPlay, inList, onToggleList }) {
  useEscape(onClose);
  const similar = RELEASED.filter((m) => m.id !== movie.id && m.genre === movie.genre).length;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Detalhes de ${movie.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ticket [--n:50%] w-full max-w-3xl grid md:grid-cols-[1fr_220px] bg-card border border-border rounded-xl shadow-2xl">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-3">
            <Badge className={`bg-primary/10 border border-primary/30 ${ACCENT}`}>{movie.soon ? "Em breve" : "Filme"} · {movie.genre}</Badge>
            <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 text-muted-foreground hover:text-foreground md:hidden"><X className="size-5" /></button>
          </div>
          <h3 className="f-display text-4xl md:text-5xl font-black text-card-foreground mb-4 leading-none">{movie.title}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5 flex-wrap">
            {!movie.soon && <span className={`flex items-center font-bold ${ACCENT}`}><Star className="size-4 fill-current mr-1" aria-hidden="true" />{movie.match}% relevante</span>}
            <span>{movie.year}</span>
            <span className="flex items-center"><Clock3 className="size-4 mr-1 opacity-70" aria-hidden="true" />{movie.duration}</span>
            <span className="px-2 py-0.5 rounded-xs border border-border text-[11px] font-bold">{movie.age === "Livre" ? "Livre" : `${movie.age} anos`}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{movie.synopsis}</p>
          {!movie.soon && <p className="text-xs italic text-muted-foreground mb-6">Elenco: {movie.cast}</p>}
          <div className="flex gap-3 flex-wrap mt-4">
            {!movie.soon && (
              <Button onClick={() => { onClose(); onPlay(movie); }}>
                <Play className="size-4 mr-2 fill-current" aria-hidden="true" /> {PROGRESS[movie.id] ? "Continuar" : "Assistir"}
              </Button>
            )}
            <Button variant="outline" onClick={() => onToggleList(movie)}>
              {inList ? <BookmarkCheck className="size-4 mr-2" aria-hidden="true" /> : <Bookmark className="size-4 mr-2" aria-hidden="true" />}
              {inList ? "Remover da lista" : movie.soon ? "Lembrar-me" : "Minha lista"}
            </Button>
          </div>
        </div>

        <div className="tear tear-v md:border-t-0 bg-secondary/15 p-6 flex flex-col justify-between gap-6">
          <button type="button" onClick={onClose} aria-label="Fechar" className="self-end p-1 text-muted-foreground hover:text-foreground hidden md:block"><X className="size-5" /></button>
          <div className="aspect-[2/3] w-full overflow-hidden rounded-md border border-border">
            <Art movie={movie} variant="poster" className="size-full object-cover" />
          </div>
          <p className="text-xs font-bold text-card-foreground">{similar > 0 ? `${similar} filme(s) parecido(s)` : "Original CineAstra"}</p>
          <Barcode seed={movie.title.length} />
        </div>
      </div>
    </div>
  );
}

function SubscribeModal({ plan, onClose }) {
  useEscape(onClose);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Assinar ${plan.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ticket [--n:50%] w-full max-w-3xl grid md:grid-cols-[1fr_220px] bg-card border border-border rounded-xl shadow-2xl">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-3">
            <Badge className={`bg-primary/10 border border-primary/30 ${ACCENT}`}>Assinatura</Badge>
            <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 text-muted-foreground hover:text-foreground md:hidden"><X className="size-5" /></button>
          </div>
          <h3 className="f-display text-4xl md:text-5xl font-black text-card-foreground mb-4 leading-none">{plan.title}</h3>
          {done ? (
            <div className="flex items-start gap-3 text-sm text-card-foreground">
              <span className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Check className="size-4" aria-hidden="true" /></span>
              <p>Pronto! Enviamos as instruções de acesso para <strong>{email}</strong>.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (valid) setDone(true); }} className="space-y-4">
              <ul className="space-y-2">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-card-foreground"><Check className={`size-4 ${ACCENT}`} aria-hidden="true" /> {perk}</li>
                ))}
              </ul>
              <div>
                <label htmlFor="sub-email" className="text-xs font-semibold text-muted-foreground block mb-2">Seu e-mail</label>
                <input id="sub-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com"
                  className="w-full rounded-full border border-border bg-muted/40 px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40" />
              </div>
              <Button type="submit" disabled={!valid} className="w-full">Continuar</Button>
            </form>
          )}
        </div>

        <div className="tear tear-v md:border-t-0 bg-secondary/15 p-6 flex flex-col justify-between gap-6">
          <button type="button" onClick={onClose} aria-label="Fechar" className="self-end p-1 text-muted-foreground hover:text-foreground hidden md:block"><X className="size-5" /></button>
          <p className="text-xs text-muted-foreground">{plan.description}</p>
          <div>
            <span className="text-xs text-muted-foreground block">Por mês</span>
            <span className={`f-display text-5xl font-black ${ACCENT}`}>{formatBRL(plan.price)}</span>
          </div>
          <Barcode seed={plan.title.length} />
        </div>
      </div>
    </div>
  );
}

function ListDrawer({ items, onRemove, onPlay, onClose }) {
  useEscape(onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label="Minha lista" className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border-l border-border h-full p-6 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="f-display text-3xl font-black text-card-foreground">Minha Lista</h3>
          <button type="button" onClick={onClose} aria-label="Fechar lista" className="text-muted-foreground hover:text-foreground"><X className="size-6" /></button>
        </div>
        <div className="space-y-4 overflow-y-auto pr-2 flex-1">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Sua lista está vazia. Adicione filmes para assistir depois.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-lg">
              <div className="w-14 h-20 shrink-0 overflow-hidden rounded-xs"><Art movie={item} variant="poster" className="size-full object-cover" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-card-foreground line-clamp-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.genre} · {item.duration}</p>
                {!item.soon && (
                  <button type="button" onClick={() => { onClose(); onPlay(item); }} className={`text-xs font-bold ${ACCENT} mt-1 inline-flex items-center hover:underline`}>
                    <Play className="size-3 mr-1 fill-current" aria-hidden="true" /> Assistir
                  </button>
                )}
              </div>
              <button type="button" onClick={() => onRemove(item)} aria-label={`Remover ${item.title}`} className="text-destructive hover:opacity-80 p-1"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ PÁGINA PRINCIPAL ============ */
export default function CineAstraStream() {
  const [genre, setGenre] = useState("Todos");
  const [playing, setPlaying] = useState(null);
  const [details, setDetails] = useState(null);
  const [plan, setPlan] = useState(null);
  const [myList, setMyList] = useState([]);
  const [isListOpen, setIsListOpen] = useState(false);

  const isInList = (id) => myList.some((i) => i.id === id);
  const toggleList = (item) => setMyList((prev) => (prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item]));

  const filtered = genre === "Todos" ? RELEASED : RELEASED.filter((m) => m.genre === genre);

  const thumb = (m) => (
    <Thumb key={m.id} movie={m} onSelect={setDetails} onPlay={setPlaying} inList={isInList(m.id)} onToggleList={toggleList} progress={PROGRESS[m.id]} />
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <CinemaStyles />

      <StreammingHeader />

    <HeroSection
      onPlay={setPlaying}
      onSelect={setDetails}
      myList={myList}
      onToggleList={toggleList}
      />

      {/* FILEIRAS DE CONTEÚDO COM ESPAÇAMENTO REFINADO */}
      <div className="relative z-30 -mt-28 sm:-mt-36 space-y-4 md:space-y-6">
        <Row title="Populares na CineAstra">{POPULAR.map((m) => thumb(m))}</Row>
        <Row title="Assistidos recentemente">{RECENT.map((m) => thumb(m))}</Row>
        <Row title="Top 10 no Brasil hoje">
          {TOP10.map((m, i) => <Top10Card key={m.id} movie={m} rank={i + 1} onSelect={setDetails} />)}
        </Row>
        <Row title="Estreias da semana">{PREMIERES.map((m) => thumb(m))}</Row>
        <Row title="Valem a espera">{SOON.map((m) => thumb(m))}</Row>
      </div>

      {/* CATÁLOGO COMPLETO */}
      <section id="catalogo" className="py-20 max-w-[1800px] mx-auto px-5 md:px-12">
        <SectionTitle eyebrow="Catálogo completo" title="Todos os filmes" description="Escolha um gênero e explore o catálogo da CineAstra." />

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {GENRES.map((g) => (
            <Button key={g} variant={genre === g ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setGenre(g)}>{g}</Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum filme neste gênero no momento.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-4">
            {filtered.map((m) => <PosterTile key={m.id} movie={m} onSelect={setDetails} inList={isInList(m.id)} />)}
          </div>
        )}
      </section>

      {/* SEÇÃO DE PLANOS */}
      <PlansSection onSelectPlan={setPlan} />

      {/* MODAIS & LISTA */}
      {playing && <PlayerModal movie={playing} onClose={() => setPlaying(null)} />}
      {details && (
        <DetailsModal
          key={details.id}
          movie={details}
          onClose={() => setDetails(null)}
          onPlay={setPlaying}
          inList={isInList(details.id)}
          onToggleList={toggleList}
        />
      )}
      {plan && <SubscribeModal plan={plan} onClose={() => setPlan(null)} />}

      {myList.length > 0 && !isListOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button size="lg" onClick={() => setIsListOpen(true)} className="shadow-2xl gap-2">
            <Bookmark className="size-5" aria-hidden="true" />
            <span>Minha lista ({myList.length})</span>
          </Button>
        </div>
      )}

      {isListOpen && (
        <ListDrawer items={myList} onRemove={toggleList} onPlay={setPlaying} onClose={() => setIsListOpen(false)} />
      )}

    </div>
  );
}