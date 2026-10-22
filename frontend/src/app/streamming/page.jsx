"use client";
/*
  CineAstra Stream — Tailwind v4 + shadcn (tokens do tema, claro/escuro)
*/
import Link from "next/link";
import { useVideoPlayer } from "@/components/cineastra-player/VideoProvider";
import { StreamHeader } from "@/components/stream-header";
import { FILMS } from "@/lib/stream-catalog";
import { Art } from "@/components/stream-discovery/film-art";
import Image from "next/image";
import React, { useState, useEffect, useRef, useId } from "react";
import {
  Film, Star, Clock3, Play, Search, LayoutGrid, ChevronLeft, ChevronRight, ArrowRight,
  Plus, Check, Volume2, Tv2, Crown, Trash2, X, Bookmark, BookmarkCheck,
  Download, Users, MonitorPlay, Ticket, Sparkles, ShieldCheck, Zap,
  Smartphone, Monitor, Tablet, Laptop, Info, Bell, LogOut, Menu, UserRound, CircleHelp
} from "lucide-react";
import { AppearanceSelector } from "@/components/appearance-selector";

/* Texto de destaque que funciona nos dois temas */
const ACCENT = "text-secondary dark:text-primary";

/* ============ DADOS (SOMENTE FILMES) ============ */


/*
  Cada filme tem um "motif" (ilustração) e uma paleta ("pal") próprios.
  Para usar imagens reais, basta adicionar `poster`, `thumb` e/ou `backdrop`
  (URLs) ao filme — o componente <Art /> usa a imagem quando ela existir.
*/

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
      onKeyDown={(e) => e.target === e.currentTarget && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(movie))}
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
            <Button variant="outline" onClick={() => { onClose(); onPlay({ ...movie, type: "trailer" }); }}><Play className="size-4 mr-2" /> Assistir trailer</Button>
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
  const { openVideo } = useVideoPlayer();
  const setPlaying = (movie) => openVideo(movie, { type: movie.type ?? (movie.seasons ? "series" : "movie") });
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

      <StreamHeader />

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
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/streamming/busca" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-bold hover:border-primary"><Search className="size-4" />Buscar um filme</Link>
          <Link href="/streamming/generos" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-bold hover:border-primary"><LayoutGrid className="size-4" />Explorar gêneros</Link>
        </div>

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