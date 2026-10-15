"use client";
import Link from "next/link";
import Footer from "@/components/Footer";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Film, Ticket, Clock3, CalendarDays, MapPin, Navigation, Copy, Check, ChevronRight,
  Car, Accessibility, Popcorn, Armchair, Tv2, Volume2, Crown, Landmark, Train, Search, X,
} from "lucide-react";

/* ============ DADOS ============ */
/* FOTOS DOS LOCAIS: troque por fotos reais em /public/cinemas/*.jpg e use "/cinemas/arquivo.jpg".
   Se a foto não carregar, aparece automaticamente uma ilustração do tipo de local (fachada, teatro, sala). */
const U = (id, w, h) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=80`;
const venuePhoto = (id) => U(id, 1400, 700);
const posterImg = (id) => U(id, 300, 450);

const MOVIES = {
  "m-1": { title: "Se Eu Fosse Você 3", genre: "Comédia", age: "10", duration: "90m", poster: posterImg("photo-1485846234645-a62644f84728") },
  "m-2": { title: "Verity", genre: "Suspense", age: "16", duration: "120m", poster: posterImg("photo-1478720568477-152d9b164e26") },
  "m-3": { title: "Outra Mamãe", genre: "Terror", age: "18", duration: "95m", poster: posterImg("photo-1497032205916-ac775f0649ae") },
  "m-4": { title: "Minha Melhor Amiga", genre: "Comédia", age: "12", duration: "120m", poster: posterImg("photo-1500530855697-b586d89ba3ee") },
  "m-5": { title: "As Aventuras de Tadeo e a Lâmpada Mágica", genre: "Animação", age: "10", duration: "95m", poster: posterImg("photo-1534447677768-be436bb09401") },
  "m-6": { title: "Constelação Kira", genre: "Ficção Científica", age: "12", duration: "141m", poster: posterImg("photo-1440404653325-ab127d49abc1") },
  "m-7": { title: "Maré Vermelha", genre: "Ação", age: "16", duration: "121m", poster: posterImg("photo-1518709268805-4e9042af9f23") },
  "m-8": { title: "O Último Fotograma", genre: "Drama", age: "14", duration: "128m", poster: posterImg("photo-1478720568477-152d9b164e26") },
};

/* kind: "marquee" (fachada com letreiro) | "curtain" (teatro) | "screen" (sala de projeção)
   schedule: { idDoFilme: { room, fmt, times: [...] } }  (endereços e CEPs são exemplos) */
const LOCATIONS = [
  {
    id: "santo-andre", kind: "marquee", type: "Cinema de shopping", name: "CineAstra Santo André",
    street: "Av. Industrial, 600", district: "Jardim, Santo André · SP", cep: "09080-500",
    ref: "Piso L3 do Shopping Astra, ao lado da praça de alimentação", hours: "13h às 23h30", rooms: 8,
    image: venuePhoto("photo-1489599849927-2ee91cede3ba"),
    perks: [{ icon: Tv2, label: "IMAX" }, { icon: Volume2, label: "Dolby Atmos" }, { icon: Car, label: "Estacionamento" }, { icon: Accessibility, label: "Acessível" }],
    schedule: {
      "m-5": { room: "Sala 1", fmt: "Dublado", times: ["11:00", "13:15", "15:30"] },
      "m-1": { room: "Sala 2", fmt: "2D", times: ["14:30", "17:15", "20:00"] },
      "m-6": { room: "IMAX", fmt: "IMAX 4K", times: ["15:00", "18:20", "21:10"] },
      "m-8": { room: "Sala 4", fmt: "Atmos", times: ["17:00", "22:30"] },
      "m-3": { room: "Sala 5", fmt: "Legendado", times: ["20:30", "22:50"] },
    },
  },
  {
    id: "paulista", kind: "screen", type: "Flagship IMAX e Gold Class", name: "CineAstra Paulista",
    street: "Av. Paulista, 1500", district: "Bela Vista, São Paulo · SP", cep: "01310-200",
    ref: "A 2 minutos a pé da estação Trianon-Masp (Linha 2-Verde)", hours: "12h às 00h", rooms: 10,
    image: venuePhoto("photo-1517604931442-7e0c8ed2963c"),
    perks: [{ icon: Tv2, label: "IMAX" }, { icon: Crown, label: "Gold Class" }, { icon: Train, label: "Metrô" }, { icon: Accessibility, label: "Acessível" }],
    schedule: {
      "m-7": { room: "Sala 3", fmt: "2D", times: ["13:40", "19:00"] },
      "m-8": { room: "Gold 1", fmt: "VIP", times: ["14:30", "17:15", "20:00", "22:30"] },
      "m-6": { room: "IMAX", fmt: "IMAX 4K", times: ["15:00", "18:20", "21:10"] },
      "m-2": { room: "Sala 5", fmt: "Atmos", times: ["15:00", "21:10"] },
      "m-3": { room: "Sala 7", fmt: "Legendado", times: ["18:00", "20:30", "22:50"] },
    },
  },
  {
    id: "teatro-sbc", kind: "curtain", type: "Cine-teatro restaurado", name: "Cine Teatro Astra",
    street: "Rua Marechal Deodoro, 1200", district: "Centro, São Bernardo do Campo · SP", cep: "09710-001",
    ref: "Em frente à Praça da Matriz, com entrada pelo hall histórico", hours: "13h às 23h", rooms: 3,
    image: venuePhoto("photo-1503095396549-807759245b35"),
    perks: [{ icon: Landmark, label: "Prédio histórico" }, { icon: Armchair, label: "Plateia e balcão" }, { icon: Accessibility, label: "Acessível" }],
    schedule: {
      "m-4": { room: "Plateia", fmt: "2D", times: ["14:00", "16:40", "19:20"] },
      "m-1": { room: "Salão Nobre", fmt: "2D", times: ["14:30", "20:00"] },
      "m-2": { room: "Plateia", fmt: "Legendado", times: ["21:30"] },
      "m-8": { room: "Balcão", fmt: "Legendado", times: ["17:30", "22:00"] },
    },
  },
  {
    id: "campinas", kind: "marquee", type: "Cinema de rua", name: "CineAstra Campinas",
    street: "Av. Norte-Sul, 800", district: "Cambuí, Campinas · SP", cep: "13024-000",
    ref: "Esquina com a Rua Coronel Quirino, com bicicletário na entrada", hours: "14h às 23h", rooms: 5,
    image: venuePhoto("photo-1505686994434-e3cc5abf1330"),
    perks: [{ icon: Armchair, label: "Poltronas reclináveis" }, { icon: Popcorn, label: "Bomboniere" }, { icon: Car, label: "Estacionamento" }],
    schedule: {
      "m-5": { room: "Sala 2", fmt: "Dublado", times: ["14:00", "16:15"] },
      "m-1": { room: "Sala 1", fmt: "2D", times: ["14:30", "17:15", "20:00"] },
      "m-4": { room: "Sala 3", fmt: "2D", times: ["19:20", "21:40"] },
    },
  },
];

const AGE_STYLES = {
  Livre: "bg-emerald-600 text-white", "10": "bg-sky-500 text-white", "12": "bg-yellow-400 text-black",
  "14": "bg-orange-500 text-white", "16": "bg-red-600 text-white", "18": "bg-black text-white border border-border",
};

/* Linha do tempo: das 11h à 01h */
const START = 11 * 60, END = 25 * 60, RANGE = END - START;
const TICKS = [12, 14, 16, 18, 20, 22, 24];
const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHM = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const pct = (min) => ((min - START) / RANGE) * 100;

/* ============ ESTILOS (mesmas classes da home; ideal mover para globals.css) ============ */
const CinemaStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap');
    .ca-root { font-family: var(--font-sans, 'Manrope', sans-serif); }
    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .f-title { font-family: 'Oswald', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .grain::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .05; mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
    .perf { height: 14px; background: repeating-linear-gradient(90deg, var(--primary) 0 12px, transparent 12px 26px); opacity: .6; border-radius: 2px; }
    .perf-v { width: 14px; background: repeating-linear-gradient(180deg, var(--border) 0 12px, transparent 12px 26px); opacity: .8; }
    .ticket { --n: 68%;
      -webkit-mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
      mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat; }
    .tear { border-top: 2px dashed var(--border); }
    .poster-scrim { background: linear-gradient(0deg, color-mix(in oklab, var(--background) 92%, transparent) 0%, color-mix(in oklab, var(--background) 45%, transparent) 40%, transparent 75%); }
    .hero-tint { background: radial-gradient(90% 70% at 88% 12%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 62%), radial-gradient(70% 60% at 0% 100%, color-mix(in oklab, var(--secondary) 22%, transparent), transparent 65%); }

    /* Letreiro de lâmpadas (o único movimento contínuo da página) */
    .bulbs { height: 14px;
      background: radial-gradient(circle at center, var(--primary) 0 3.5px, transparent 4.5px) 0 50% / 22px 14px repeat-x;
      filter: drop-shadow(0 0 4px color-mix(in oklab, var(--primary) 70%, transparent));
      animation: bulb 2.4s steps(1) infinite; }
    @keyframes bulb { 50% { opacity: .55; } }
    .ca-root input::placeholder { opacity: .78; }
    .ca-root button, .ca-root a { -webkit-tap-highlight-color: transparent; }
    .ca-root :focus-visible { scroll-margin-top: 6rem; }
    @media (max-width: 640px) {
      .ca-root .ticket { grid-template-columns: 76px minmax(0, 1fr); min-height: 0; }
      .ca-root .ticket > div:last-child { padding: .75rem; }
    }
    .reveal { animation: reveal .35s ease-out both; }
    @keyframes reveal { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .bulbs, .reveal { animation: none; } }
  `}</style>
);

/* ============ ILUSTRAÇÕES DE LOCAIS (fallback das fotos) ============ */
function VenueArt({ kind, className = "" }) {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <rect width="400" height="250" className="fill-card" />

      {kind === "marquee" && (
        <g>
          <rect y="180" width="400" height="70" className="fill-muted" />
          <rect x="40" y="62" width="320" height="120" className="fill-secondary" />
          <rect x="84" y="30" width="232" height="56" rx="4" className="fill-background stroke-primary" strokeWidth="3" />
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i}>
              <circle cx={96 + i * 19} cy="37" r="2.5" className="fill-primary" />
              <circle cx={96 + i * 19} cy="79" r="2.5" className="fill-primary" />
            </g>
          ))}
          <text x="200" y="66" textAnchor="middle" fontSize="26" fontWeight="900" className="fill-primary" style={{ fontFamily: "'Big Shoulders Display', Impact, sans-serif" }}>CINEASTRA</text>
          {[58, 312].map((x) => <rect key={x} x={x} y="104" width="30" height="46" rx="2" className="fill-background stroke-border" strokeWidth="2" />)}
          {[128, 180, 232].map((x) => <rect key={x} x={x} y="118" width="40" height="64" rx="2" className="fill-background stroke-border" strokeWidth="2" />)}
        </g>
      )}

      {kind === "curtain" && (
        <g>
          <rect width="400" height="250" className="fill-background" />
          <polygon points="200,0 110,196 290,196" className="fill-primary" opacity=".16" />
          <rect y="192" width="400" height="58" className="fill-muted" />
          <path d="M0 0 H124 C102 80 132 150 92 250 H0 Z" className="fill-secondary" />
          <path d="M400 0 H276 C298 80 268 150 308 250 H400 Z" className="fill-secondary" />
          <rect width="400" height="26" className="fill-secondary" />
          {Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={20 + i * 40} cy="26" r="20" className="fill-secondary" />)}
          {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={14 + i * 32} y="222" width="24" height="28" rx="7" className="fill-card stroke-border" strokeWidth="2" />)}
        </g>
      )}

      {kind === "screen" && (
        <g>
          <rect width="400" height="250" className="fill-background" />
          <path d="M50 40 Q200 8 350 40 L350 118 Q200 88 50 118 Z" className="fill-primary stroke-primary" strokeWidth="3" fillOpacity=".22" />
          {[0, 1, 2, 3].map((r) => {
            const n = 10 + r * 2, w = 14 + r * 3, gap = 6, total = n * (w + gap) - gap;
            return Array.from({ length: n }).map((_, c) => (
              <rect key={`${r}-${c}`} x={(400 - total) / 2 + c * (w + gap)} y={150 + r * 24} width={w} height={14 + r * 2} rx="5" className="fill-secondary" />
            ));
          })}
        </g>
      )}
    </svg>
  );
}

function VenueImg({ src, kind, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed || !src) return <VenueArt kind={kind} className={`w-full h-full ${className}`} />;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`w-full h-full object-cover ${className}`} />;
}

function PosterImg({ src, title }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return <div role="img" aria-label={title} className="w-full h-full bg-gradient-to-br from-secondary via-card to-background flex items-center justify-center"><Film className="w-5 h-5 text-primary/60" aria-hidden="true" /></div>;
  }
  return <img src={src} alt={`Pôster de ${title}`} loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />;
}

/* ============ AUXILIARES ============ */
function Button({ children, variant = "default", size = "default", className = "", type = "button", ...props }) {
  let base = "inline-flex items-center justify-center font-bold transition-all rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ";
  if (variant === "default") base += "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 ";
  if (variant === "wine") base += "bg-secondary text-secondary-foreground hover:opacity-90 ";
  if (variant === "outline") base += "border border-border bg-background/50 text-foreground hover:border-primary hover:text-primary ";
  if (size === "sm") base += "px-3 py-1.5 text-xs ";
  if (size === "default") base += "px-6 py-3 text-sm ";
  return <button type={type} className={`${base} ${className}`} {...props}>{children}</button>;
}

function AgeBadge({ age }) {
  return <span aria-label={`Classificação ${age}`} className={`inline-flex min-w-[28px] h-6 px-1.5 items-center justify-center rounded-md text-xs font-bold ${AGE_STYLES[age] || "bg-muted text-foreground"}`}>{age}</span>;
}

/* ============ LISTA DE CINEMAS ============ */
function LocationItem({ loc, selected, onSelect }) {
  return (
    <button
      type="button" onClick={() => onSelect(loc.id)} aria-pressed={selected} style={{ "--n": "50%" }}
      className={`ticket group w-full text-left grid grid-cols-[92px_1fr] min-h-[112px] rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer hover:shadow-md ${selected ? "bg-secondary/25 border-primary shadow-sm" : "bg-card border-border hover:border-primary/60"}`}
    >
      <div className="relative bg-muted overflow-hidden">
        <VenueImg src={loc.image} kind={loc.kind} alt={`${loc.type}: ${loc.name}`} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-y-0 right-0 w-3 perf-v" aria-hidden="true" />
      </div>
      <div className="p-3 min-w-0">
        <span className="text-xs font-semibold text-primary block mb-1">{loc.type}</span>
        <h3 className="f-title uppercase text-base leading-snug text-card-foreground mb-1">{loc.name}</h3>
        <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-primary" aria-hidden="true" />
          <span>{loc.street}<br />{loc.district}</span>
        </p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/70 text-xs text-muted-foreground">
          <span>{Object.keys(loc.schedule).length} filmes hoje · {loc.rooms} salas</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${selected ? "text-primary translate-x-0.5" : ""}`} aria-hidden="true" />
        </div>
      </div>
    </button>
  );
}

/* ============ GRADE DE SESSÕES (linha do tempo) ============ */
function Timetable({ loc, day, now }) {
  const isToday = day === 0;
  const isPast = (t) => isToday && now != null && toMin(t) < now;
  const nowLeft = isToday && now != null && now >= START && now <= END ? pct(now) : null;
  const entries = Object.entries(loc.schedule);

  return (
    <div>
      {/* Eixo das horas (desktop) */}
      <div className="hidden md:grid grid-cols-[240px_1fr] gap-4 mb-2" aria-hidden="true">
        <span />
        <div className="relative h-4">
          {TICKS.map((h) => (
            <span key={h} className="absolute -translate-x-1/2 text-[10px] font-semibold text-muted-foreground" style={{ left: `${pct(h * 60)}%` }}>{h === 24 ? "00h" : `${h}h`}</span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {entries.map(([id, s]) => {
          const m = MOVIES[id];
          if (!m) return null;
          const dur = parseInt(m.duration, 10);
          const href = (t) => `/ingressos?cinema=${loc.id}&filme=${id}&sessao=${t}&dia=${day}`;
          return (
            <article key={`${day}-${id}`} className="grid md:grid-cols-[210px_1fr] gap-x-3 gap-y-2 items-center border border-border bg-background/40 rounded-lg p-3 transition-colors hover:border-primary/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-[60px] shrink-0 overflow-hidden rounded-md bg-muted"><PosterImg src={m.poster} title={m.title} /></div>
                <div className="min-w-0">
                  <h4 className="f-title uppercase text-sm leading-snug text-card-foreground line-clamp-2">{m.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">{s.room} · {s.fmt} · {m.duration}</p>
                  <div className="mt-1"><AgeBadge age={m.age} /></div>
                </div>
              </div>

              {/* Mobile: horários em botões */}
              <div className="flex flex-wrap gap-2 md:hidden">
                {s.times.map((t) => {
                  const past = isPast(t);
                  return (
                    <Link key={t} href={href(t)} aria-disabled={past} tabIndex={past ? -1 : 0} onClick={(e) => past && e.preventDefault()}
                      className={`px-2.5 py-1.5 rounded-sm border text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${past ? "border-border text-muted-foreground/60 line-through" : "border-primary/50 bg-primary/10 text-primary"}`}>
                      {t}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop: blocos na linha do tempo (início e fim de cada sessão) */}
              <div className="relative hidden md:block h-11 rounded-lg bg-muted/30 border border-border overflow-hidden">
                {TICKS.map((h) => <span key={h} className="absolute inset-y-0 border-l border-border/50" style={{ left: `${pct(h * 60)}%` }} aria-hidden="true" />)}
                {s.times.map((t) => {
                  const start = toMin(t), past = isPast(t);
                  return (
                    <Link key={t} href={href(t)} title={`${t} às ${toHM(start + dur)} · ${s.room} · ${s.fmt}`}
                      aria-disabled={past} tabIndex={past ? -1 : 0} onClick={(e) => past && e.preventDefault()}
                      className={`absolute top-1.5 bottom-1.5 flex items-center justify-center rounded-sm text-[11px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground transition-opacity ${past ? "bg-muted text-muted-foreground/70 line-through pointer-events-none" : "bg-primary text-primary-foreground hover:opacity-85"}`}
                      style={{ left: `${pct(start)}%`, width: `calc(${(dur / RANGE) * 100}% - 3px)` }}>
                      {t}
                    </Link>
                  );
                })}
                {nowLeft != null && <span className="absolute inset-y-0 w-0.5 bg-red-500 z-10" style={{ left: `${nowLeft}%` }} aria-hidden="true" />}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ============ PAINEL DO CINEMA ESCOLHIDO ============ */
function LocationPanel({ loc }) {
  const days = useMemo(() => {
    const base = new Date();
    return [0, 1, 2, 3].map((i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      return {
        key: i,
        label: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(d).replace(".", ""),
        date: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d).replace(".", ""),
      };
    });
  }, []);

  const [day, setDay] = useState(0);
  const [now, setNow] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => { const d = new Date(); setNow(d.getHours() * 60 + d.getMinutes()); };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  const fullAddress = `${loc.street}, ${loc.district}, CEP ${loc.cep}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(fullAddress); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sem permissão de área de transferência */ }
  };

  return (
    <div className="reveal bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
      <div className="bulbs" aria-hidden="true" />

      {/* Foto do local */}
      <div className="relative aspect-[16/7] bg-muted">
        <VenueImg src={loc.image} kind={loc.kind} alt={`${loc.type}: ${loc.name}`} className="absolute inset-0" />
        <div className="absolute inset-0 poster-scrim" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <span className="inline-flex items-center rounded-lg bg-background/70 backdrop-blur-md border border-border px-2.5 py-1 text-xs font-bold text-foreground f-title mb-2">{loc.type}</span>
          <h2 className="f-display text-3xl md:text-5xl font-black text-foreground leading-[0.95]">{loc.name}</h2>
        </div>
      </div>

      {/* Endereço em destaque */}
      <div className="grid md:grid-cols-[1fr_auto] gap-5 p-4 md:p-5 items-center">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2"><MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Endereço</span>
          <p className="f-title text-xl md:text-2xl text-card-foreground leading-tight">{loc.street}</p>
          <p className="text-sm text-muted-foreground mt-1">{loc.district} · CEP {loc.cep}</p>
          <p className="text-sm text-foreground/80 mt-3 max-w-lg leading-relaxed">{loc.ref}</p>
        </div>
        <div className="flex flex-wrap md:flex-col gap-2">
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.name}, ${fullAddress}`)}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:opacity-90 shadow-md shadow-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Navigation className="w-4 h-4 mr-2" aria-hidden="true" /> Como chegar
          </a>
          <Button variant="outline" onClick={copy} aria-live="polite">
            {copied ? <Check className="w-4 h-4 mr-2" aria-hidden="true" /> : <Copy className="w-4 h-4 mr-2" aria-hidden="true" />}
            {copied ? "Endereço copiado" : "Copiar endereço"}
          </Button>
        </div>
      </div>

      <div className="mx-4 md:mx-5 flex flex-wrap items-center gap-x-4 gap-y-2 pb-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock3 className="w-4 h-4 text-primary" aria-hidden="true" /> Aberto das {loc.hours}</span>
        {loc.perks.map((p) => <span key={p.label} className="inline-flex items-center gap-1.5"><p.icon className="w-4 h-4 text-primary" aria-hidden="true" />{p.label}</span>)}
      </div>

      <div className="tear mx-6 md:mx-8" aria-hidden="true" />

      {/* Programação */}
      <div className="p-4 md:p-5">
        <div className="flex items-stretch gap-3 mb-4">
          <div className="perf-v rounded-sm" aria-hidden="true" />
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-0.5"><Ticket className="w-3.5 h-3.5" aria-hidden="true" /> Sessões neste endereço</span>
            <h3 className="f-display uppercase text-2xl md:text-3xl font-black leading-[0.95] text-foreground">Filmes em cartaz</h3>
          </div>
        </div>

        <div role="tablist" aria-label="Dia da sessão" className="no-scrollbar flex gap-2 mb-4 overflow-x-auto pb-1">
          {days.map((d) => (
            <Button key={d.key} role="tab" aria-selected={day === d.key} variant={day === d.key ? "wine" : "outline"} onClick={() => setDay(d.key)}
              className={`shrink-0 !rounded-lg flex-col !py-1.5 !px-3 ${day === d.key ? "border border-primary/40 !text-primary" : ""}`}>
              <span className="flex items-center capitalize text-xs"><CalendarDays className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />{d.label}</span>
              <span className="text-[11px] font-medium opacity-70 capitalize">{d.date}</span>
            </Button>
          ))}
        </div>

        <div className="max-h-[62vh] overflow-y-auto overscroll-contain pr-1 rounded-lg"><Timetable loc={loc} day={day} now={now} /></div>

        <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
          Cada bloco vai do início ao fim da sessão. {day === 0 && "A linha vermelha marca a hora atual e sessões já iniciadas aparecem riscadas. "}Horários sujeitos a alteração.
        </p>
      </div>
      <div className="perf !rounded-none" aria-hidden="true" />
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="bg-card/60 border-2 border-dashed border-border rounded-xl overflow-hidden">
      <div className="bulbs" aria-hidden="true" />
      <div className="aspect-[16/7] bg-muted"><VenueArt kind="marquee" className="w-full h-full" /></div>
      <div className="p-8 md:p-10 text-center">
        <h2 className="f-display text-3xl md:text-4xl font-black text-foreground leading-none">Escolha um cinema</h2>
        <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
          Selecione um local na lista para ver o endereço e os horários de cada filme.
        </p>
      </div>
    </div>
  );
}

/* ============ PÁGINA ============ */
export default function CinemasPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const panelRef = useRef(null);
  const selected = LOCATIONS.find((l) => l.id === selectedId);

  const filteredLocations = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
    if (!term) return LOCATIONS;

    return LOCATIONS.filter((loc) =>
      [loc.name, loc.type, loc.street, loc.district, loc.cep, loc.ref]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term))
    );
  }, [searchTerm]);

  /* No celular o painel fica abaixo da lista: rola até ele ao escolher um cinema */
  useEffect(() => {
    if (!selected || window.innerWidth >= 1024) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 60);
    return () => clearTimeout(t);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ca-root min-h-screen bg-background text-foreground transition-colors duration-300">
      <CinemaStyles />

      <section className="grain relative bg-background pt-24 pb-8 overflow-hidden">
        <div className="absolute inset-0 hero-tint" aria-hidden="true" />
        <div className="relative z-10 max-w-[1600px] mx-auto px-5 md:px-8">
          <h1 className="f-display text-4xl sm:text-6xl lg:text-[5rem] font-black text-foreground uppercase leading-[0.9] mb-3">Nossos cinemas</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
            {LOCATIONS.length} endereços entre cinemas e cine-teatros. Escolha um para ver onde fica e que horas passa cada filme.
          </p>
        </div>
        <div className="bulbs absolute bottom-0 inset-x-0" aria-hidden="true" />
      </section>

      <section className="relative pt-7 pb-12 bg-background" aria-label="Cinemas e programação">
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 grid lg:grid-cols-[360px_1fr] gap-6 xl:gap-8 items-start">
          <div className="lg:sticky lg:top-20 space-y-3">
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <label htmlFor="cinema-search" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Buscar local
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <input
                  id="cinema-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nome, cidade, bairro ou endereço..."
                  aria-label="Pesquisar cinemas por nome, cidade, bairro ou endereço"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Limpar pesquisa"
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
                {filteredLocations.length} {filteredLocations.length === 1 ? "local encontrado" : "locais encontrados"}
              </p>
            </div>

            {filteredLocations.length > 0 ? (
              <div className="space-y-2 lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto lg:pr-2 overscroll-contain">
                {filteredLocations.map((loc) => (
                  <LocationItem
                    key={loc.id}
                    loc={loc}
                    selected={loc.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <MapPin className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <h2 className="f-title text-lg uppercase text-foreground">Nenhum local encontrado</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tente pesquisar por outra cidade, bairro ou nome de cinema.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchTerm("")}>
                  Limpar pesquisa
                </Button>
              </div>
            )}
          </div>

          <div ref={panelRef} className="scroll-mt-24 min-w-0" aria-live="polite">
            {selected ? <LocationPanel key={selected.id} loc={selected} /> : <EmptyPanel />}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}