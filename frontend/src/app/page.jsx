"use client";

import React, { useState, useEffect } from "react";
import {
  Film, Ticket, Star, Clock3, CalendarDays, Play,
  ChevronLeft, ChevronRight, Sparkles, ArrowRight, Plus, Minus, Check,
  Volume2, Tv2, Crown, Trash2, X
} from "lucide-react";

/* ============ DADOS ============ */
const U = (id, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

const HERO_MOVIES = [
  { id: "hero-1", title: "O Último Fotograma", subtitle: "Algumas histórias só terminam quando alguém as assiste até o fim.", genre: "Suspense · Drama", duration: "2h 08min", rating: "14 anos", score: "4.9", format: "IMAX 3D · DOLBY ATMOS", image: U("photo-1478720568477-152d9b164e26", 2200), poster: U("photo-1478720568477-152d9b164e26"), synopsis: "Um misterioso fotógrafo descobre rolos de filme não revelados em um estúdio abandonado, revelando eventos que reescrevem o passado e ameaçam o futuro.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["14:30", "17:15", "20:00", "22:30"] },
  { id: "hero-2", title: "Constelação Kira", subtitle: "O universo respondeu. Agora precisamos descobrir o que ele disse.", genre: "Ficção Científica · Aventura", duration: "2h 21min", rating: "12 anos", score: "4.8", format: "IMAX 4K · D-BOX", image: U("photo-1446776811953-b23d57bd21aa", 2200), poster: U("photo-1440404653325-ab127d49abc1"), synopsis: "Uma expedição interestelar parte para investigar um sinal emitido das profundezas de uma nebulosa, onde as leis da física conhecidas não se aplicam.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["15:00", "18:20", "21:10"] },
  { id: "hero-3", title: "Baile das Sombras", subtitle: "Depois da meia-noite, ninguém deveria estar olhando para trás.", genre: "Terror · Mistério", duration: "1h 54min", rating: "16 anos", score: "4.7", format: "4K · ATMOS", image: U("photo-1489599849927-2ee91cede3ba", 2200), poster: U("photo-1497032205916-ac775f0649ae"), synopsis: "Em uma mansão vitoriana isolada, convidados para um baile de máscaras percebem que seus anfitriões pertencem a uma ordem esquecida no tempo.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["18:00", "20:30", "22:50"] }
];

const CATEGORIES = ["Todos", "Lançamentos", "Ação", "Drama", "Comédia", "Terror", "Ficção Científica", "Animação"];

const NOW_PLAYING = [
  { id: "m-1", title: "O Último Fotograma", genre: "Suspense", score: "4.9", age: "14", duration: "2h 08min", category: "Lançamentos", poster: U("photo-1478720568477-152d9b164e26"), sessions: ["14:30", "17:15", "20:00", "22:30"] },
  { id: "m-2", title: "Constelação Kira", genre: "Ficção Científica", score: "4.8", age: "12", duration: "2h 21min", category: "Ficção Científica", poster: U("photo-1440404653325-ab127d49abc1"), sessions: ["15:00", "18:20", "21:10"] },
  { id: "m-3", title: "Maré Vermelha", genre: "Ação", score: "4.6", age: "16", duration: "2h 01min", category: "Ação", poster: U("photo-1518709268805-4e9042af9f23"), sessions: ["13:40", "16:15", "19:00", "21:45"] },
  { id: "m-4", title: "Baile das Sombras", genre: "Terror", score: "4.7", age: "16", duration: "1h 54min", category: "Terror", poster: U("photo-1497032205916-ac775f0649ae"), sessions: ["18:00", "20:30", "22:50"] },
  { id: "m-5", title: "Sete Invernos", genre: "Drama", score: "4.5", age: "12", duration: "1h 58min", category: "Drama", poster: U("photo-1500530855697-b586d89ba3ee"), sessions: ["14:00", "16:40", "19:20"] },
  { id: "m-6", title: "O Segredo de Gaia", genre: "Animação", score: "4.9", age: "Livre", duration: "1h 38min", category: "Animação", poster: U("photo-1534447677768-be436bb09401"), sessions: ["11:00", "13:15", "15:30", "17:45"] }
];

const COMBOS = [
  { id: "c-1", title: "Combo CineAstra Supreme", description: "1 Pipoca Balde Especial + 2 Refrigerantes 1L + 1 M&M's Gigante", price: 52.9, priceFormatted: "R$ 52,90", label: "Mais vendido", image: U("photo-1585647347384-2593bc35786b", 1000) },
  { id: "c-2", title: "Combo Duo Gold", description: "1 Pipoca Grande + 2 Bebidas 700ml + 1 Nachos com Queijo", price: 44.9, priceFormatted: "R$ 44,90", label: "Para dois", image: U("photo-1578849278619-74b2c2bc9852", 1000) },
  { id: "c-3", title: "Pipoca Caramelizada Gourmet", description: "Pipoca crocante envolvida em caramelo artesanal e flor de sal", price: 28.9, priceFormatted: "R$ 28,90", label: "Gourmet", image: U("photo-1588614959060-4d144f28b207", 1000) },
  { id: "c-4", title: "Sweet Cinema Deluxe", description: "Chocolates importados + Balas de Goma + Refrigerante 500ml", price: 32.9, priceFormatted: "R$ 32,90", label: "Sobremesa", image: U("photo-1578985545062-69928b1d9587", 1000) }
];


/* ============ ESTILOS GLOBAIS (cinema) ============ */
const CinemaStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');
    .ca-root{font-family:'Manrope',system-ui,sans-serif}
    .f-display{font-family:'Big Shoulders Display','Arial Narrow',Impact,sans-serif;letter-spacing:.01em}
    /* grão de película */
    .grain::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:overlay;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
    /* perfurações de filme */
    .perf{height:14px;background:repeating-linear-gradient(90deg,rgba(105,21,40,.9) 0 12px,transparent 12px 26px);
      -webkit-mask:linear-gradient(#000,#000);border-radius:2px}
    .perf-v{width:14px;background:repeating-linear-gradient(180deg,rgba(236,225,220,.2) 0 12px,transparent 12px 26px)}
    /* ingresso com entalhes laterais */
    .ticket{--n:68%;
      -webkit-mask:radial-gradient(circle 10px at 0 var(--n),#0000 97%,#000) left/51% 100% no-repeat,radial-gradient(circle 10px at 100% var(--n),#0000 97%,#000) right/51% 100% no-repeat;
      mask:radial-gradient(circle 10px at 0 var(--n),#0000 97%,#000) left/51% 100% no-repeat,radial-gradient(circle 10px at 100% var(--n),#0000 97%,#000) right/51% 100% no-repeat}
    .ticket-v{--n:62%;
      -webkit-mask:radial-gradient(circle 11px at var(--n) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle 11px at var(--n) 100%,#0000 97%,#000) bottom/100% 51% no-repeat;
      mask:radial-gradient(circle 11px at var(--n) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle 11px at var(--n) 100%,#0000 97%,#000) bottom/100% 51% no-repeat}
    .tear{border-top:2px dashed rgba(236,225,220,.22)}
    .tear-v{border-left:2px dashed rgba(236,225,220,.22)}
    /* feixe do projetor */
    .beam{clip-path:polygon(90% 0,100% 0,100% 100%,0 100%);
      background:linear-gradient(190deg,rgba(250,210,65,.28),rgba(250,210,65,.06) 55%,transparent 85%);
      mix-blend-mode:screen;animation:flicker 4s infinite steps(1)}
    @keyframes flicker{0%,100%{opacity:1}6%{opacity:.8}9%{opacity:1}52%{opacity:.88}55%{opacity:1}}
    /* tela curva */
    .screen-curve{border-radius:50% 50% 0 0/14% 14% 0 0;box-shadow:0 -30px 80px -20px rgba(250,210,65,.25)}
    .seat{width:16px;height:12px;border-radius:5px 5px 2px 2px;background:#691528;opacity:.8}
    @keyframes rise{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}
    .slide-in{animation:rise .3s ease-out}
    @media (prefers-reduced-motion:reduce){.beam,.slide-in{animation:none}}
  `}</style>
);

/* ============ ÍCONES / FORMAS DE CINEMA ============ */
const Projector = ({ className = "" }) => (
  <svg viewBox="0 0 120 80" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="32" cy="22" r="18" /><circle cx="72" cy="22" r="18" />
    <circle cx="32" cy="22" r="4" fill="currentColor" /><circle cx="72" cy="22" r="4" fill="currentColor" />
    <rect x="10" y="42" width="86" height="26" rx="6" />
    <path d="M96 48h10l8 4v10l-8 4H96z" fill="currentColor" fillOpacity=".25" />
    <path d="M26 68l-6 10M80 68l6 10" />
  </svg>
);

const Barcode = ({ seed = 7 }) => (
  <div className="flex items-end gap-[2px] h-10">
    {Array.from({ length: 34 }).map((_, i) => (
      <span key={i} className="bg-[#ECE1DC]/80" style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
    ))}
  </div>
);

/* ============ PRIMITIVOS ============ */
function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}

function Button({ children, variant = "default", size = "default", className = "", onClick, ...props }) {
  let base = "inline-flex items-center justify-center font-bold transition-all rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAD241] ";
  if (variant === "default") base += "bg-[#FAD241] text-black hover:bg-[#ffe27a] shadow-[0_0_30px_-8px_#FAD241] ";
  if (variant === "wine") base += "bg-[#691528] text-[#ECE1DC] hover:bg-[#8a1c35] ";
  if (variant === "outline") base += "border border-white/20 bg-black/40 text-[#ECE1DC] hover:border-[#FAD241] hover:text-[#FAD241] ";
  if (variant === "ghost") base += "text-white/60 hover:text-white hover:bg-white/10 ";
  if (variant === "link") base += "text-[#FAD241] hover:text-[#ECE1DC] p-0 h-auto ";
  if (size === "sm") base += "px-3 py-1.5 text-xs ";
  if (size === "default") base += "px-6 py-3 text-sm ";
  if (size === "lg") base += "px-8 py-4 text-base ";
  if (size === "icon") base += "p-2.5 ";
  return <button onClick={onClick} className={`${base} ${className}`} {...props}>{children}</button>;
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-10 flex items-start gap-4">
      <div className="hidden sm:block perf-v self-stretch rounded-sm" />
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#FAD241] mb-1">
          <Film className="w-4 h-4" /> {eyebrow}
        </div>
        <h2 className="f-display text-5xl md:text-7xl font-black text-[#ECE1DC] leading-[0.95]">{title}</h2>
        {description && <p className="text-sm text-[#ECE1DC]/55 mt-3 max-w-xl leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

/* ============ HERO ============ */
function HeroSection({ onOpenTrailer, onSelectMovie }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur((p) => (p + 1) % HERO_MOVIES.length), 8000);
    return () => clearInterval(t);
  }, []);
  const movie = HERO_MOVIES[cur];

  return (
    <section id="hero" className="grain relative min-h-[88vh] lg:min-h-[94vh] bg-black flex items-end pt-24 overflow-hidden">
      {HERO_MOVIES.map((m, i) => (
        <div key={m.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === cur ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${m.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>
      ))}

      {/* feixe do projetor + projetor */}
      <div className="beam absolute top-0 right-0 w-[70%] h-full z-10 pointer-events-none" />
      <Projector className="absolute top-20 right-[6%] w-28 md:w-40 text-[#ECE1DC]/25 z-10 hidden md:block" />

      {/* tiras de filme nas bordas */}
      <div className="perf absolute top-0 inset-x-0 z-20" />
      <div className="perf absolute bottom-0 inset-x-0 z-20" />

      <div className="relative z-20 max-w-[1600px] mx-auto px-5 md:px-8 pb-20 pt-12 w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <Badge className="bg-[#FAD241]/10 border border-[#FAD241]/40 text-[#FAD241]"><Sparkles className="w-3 h-3 mr-1" /> Estreia em destaque</Badge>
              <Badge className="bg-[#691528]/70 border border-[#691528] text-[#ECE1DC] text-[11px]">{movie.format}</Badge>
            </div>
            <p className="text-[#FAD241] font-semibold text-sm mb-3 max-w-lg">{movie.subtitle}</p>
            <h1 className="f-display text-6xl sm:text-8xl lg:text-[9.5rem] font-black text-[#ECE1DC] uppercase leading-[0.85] mb-6">{movie.title}</h1>
            <p className="text-sm md:text-base text-[#ECE1DC]/70 max-w-xl mb-6 line-clamp-3 leading-relaxed">{movie.synopsis}</p>
            <div className="flex items-center gap-4 text-sm text-[#ECE1DC]/70 mb-8 flex-wrap">
              <span className="flex items-center text-[#FAD241] font-bold"><Star className="w-4 h-4 fill-current mr-1" />{movie.score}</span>
              <span className="flex items-center"><Clock3 className="w-4 h-4 mr-1 text-[#ECE1DC]/50" />{movie.duration}</span>
              <span>{movie.genre}</span>
              <span className="px-2 py-0.5 rounded border border-white/25 text-[11px] font-bold">{movie.rating}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button size="lg" onClick={() => onSelectMovie(movie)}><Ticket className="w-5 h-5 mr-2" /> Garantir ingressos</Button>
              <Button size="lg" variant="outline" onClick={() => onOpenTrailer(movie)}><Play className="w-5 h-5 mr-2 fill-current" /> Assistir trailer</Button>
            </div>
          </div>

          {/* quadros de filme */}
          <div className="lg:col-span-4 flex flex-col items-start lg:items-end">
            <div className="flex items-center gap-3 mb-5">
              <Button size="icon" variant="outline" aria-label="Anterior" onClick={() => setCur((p) => (p === 0 ? HERO_MOVIES.length - 1 : p - 1))}><ChevronLeft className="w-6 h-6" /></Button>
              <Button size="icon" variant="outline" aria-label="Próximo" onClick={() => setCur((p) => (p + 1) % HERO_MOVIES.length)}><ChevronRight className="w-6 h-6" /></Button>
            </div>
            <div className="flex gap-1 bg-black/70 border border-white/10 p-2 rounded-md">
              {HERO_MOVIES.map((m, i) => (
                <button key={m.id} onClick={() => setCur(i)} aria-label={m.title}
                  className={`w-20 h-28 overflow-hidden rounded-sm border-2 transition-all ${i === cur ? "border-[#FAD241] shadow-[0_0_24px_-4px_#FAD241]" : "border-transparent opacity-45 hover:opacity-100"}`}>
                  <img src={m.poster} alt={m.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ CARD DE FILME ============ */
function PosterCard({ movie, onSelectMovie }) {
  return (
    <div onClick={() => onSelectMovie(movie)}
      className="group bg-[#12110f] border border-white/10 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[#FAD241]/50 hover:shadow-2xl hover:shadow-[#691528]/40 flex flex-col h-full">
      <div className="perf !rounded-none bg-black/60" />
      <div className="relative aspect-[2/3] overflow-hidden bg-black">
        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
        <Badge className="absolute top-3 left-3 bg-black/75 border border-white/20 text-[#ECE1DC]">{movie.age}</Badge>
        <Badge className="absolute top-3 right-3 bg-black/75 border border-[#FAD241]/40 text-[#FAD241] font-bold"><Star className="w-3 h-3 fill-current mr-1" />{movie.score}</Badge>
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 backdrop-blur-sm">
          <Button className="w-full"><Ticket className="w-4 h-4 mr-1.5" /> Comprar</Button>
        </div>
      </div>
      <div className="perf !rounded-none bg-black/60" />
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <span className="text-xs font-semibold text-[#FAD241] block mb-1">{movie.genre}</span>
          <h3 className="font-bold text-base text-[#ECE1DC] group-hover:text-[#FAD241] transition-colors line-clamp-1">{movie.title}</h3>
          <p className="text-xs text-[#ECE1DC]/50 mt-1 flex items-center"><Clock3 className="w-3 h-3 mr-1" />{movie.duration}</p>
        </div>
        <div className="mt-4 pt-3 tear">
          <p className="text-xs text-[#ECE1DC]/40 mb-2">Próximas sessões</p>
          <div className="flex gap-1.5 flex-wrap">
            {movie.sessions.slice(0, 3).map((t) => (
              <span key={t} className="px-2 py-1 rounded-sm bg-[#691528]/40 border border-[#691528] text-[11px] font-bold text-[#ECE1DC] group-hover:text-[#FAD241]">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ EXPERIÊNCIA (tela de cinema) ============ */
function ExperienceSection() {
  const [tab, setTab] = useState("imax");
  const features = {
    imax: { icon: Tv2, label: "IMAX 4K Laser", title: "CineAstra IMAX® 4K Laser", description: "Telas gigantescas do chão ao teto e da parede à parede, com projeção laser dupla 4K para uma nitidez sem precedentes.", tags: ["Telas curvas de 24m", "Projeção laser 4K", "Assentos reclináveis premium"], image: U("photo-1489599849927-2ee91cede3ba", 1600) },
    atmos: { icon: Volume2, label: "Dolby Atmos®", title: "Som imersivo Dolby Atmos®", description: "64 canais de áudio independentes com alto-falantes no teto que fazem o som se mover ao seu redor com precisão tridimensional.", tags: ["Som 360° tridimensional", "Subwoofers duplos", "Isolamento acústico VIP"], image: U("photo-1517604931442-7e0c8ed2963c", 1600) },
    vip: { icon: Crown, label: "Gold Class VIP", title: "Salas VIP Gold Class Lounge", description: "Poltronas duplas de couro reclináveis eletricamente, com serviço de garçom acionado por botão direto no assento.", tags: ["Atendimento no assento", "Carta de vinhos e cocktails", "Poltronas chaise longue"], image: U("photo-1585647347384-2593bc35786b", 1600) }
  };
  const item = features[tab];

  return (
    <section id="experiencia" className="grain relative py-24 bg-gradient-to-b from-black via-[#12100e] to-black border-y border-white/10 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8 relative z-10">
        <SectionTitle eyebrow="Tecnologia de ponta" title="A experiência CineAstra" description="Transformamos o simples ato de ir ao cinema em uma jornada sensorial, com os mais elevados padrões mundiais." />

        <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
          {Object.entries(features).map(([key, f]) => (
            <Button key={key} variant={tab === key ? "wine" : "outline"} onClick={() => setTab(key)} className={tab === key ? "border border-[#FAD241]/40 !text-[#FAD241]" : ""}>
              <f.icon className="w-4 h-4 mr-2" /> {f.label}
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <h3 className="f-display text-5xl md:text-6xl font-black text-[#ECE1DC] leading-[0.95] mb-4">{item.title}</h3>
            <p className="text-sm md:text-base text-[#ECE1DC]/70 leading-relaxed mb-8">{item.description}</p>
            <div className="space-y-3 mb-8">
              {item.tags.map((tag) => (
                <div key={tag} className="flex items-center gap-3 text-sm font-semibold text-[#ECE1DC]">
                  <span className="w-5 h-5 rounded-full bg-[#691528] flex items-center justify-center text-[#FAD241]"><Check className="w-3 h-3" /></span>
                  {tag}
                </div>
              ))}
            </div>
            <Button>Conhecer programação VIP <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>

          {/* tela de cinema + plateia */}
          <div className="lg:col-span-7">
            <div className="screen-curve overflow-hidden border-t-4 border-x-4 border-[#ECE1DC]/20 bg-black aspect-[16/8] relative">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>
            <div className="mx-auto w-[88%] h-6 bg-gradient-to-b from-[#FAD241]/20 to-transparent blur-md" />
            <div className="mt-3 flex flex-col items-center gap-2" aria-hidden="true">
              {[10, 12, 14].map((n) => (
                <div key={n} className="flex gap-2">{Array.from({ length: n }).map((_, i) => <span key={i} className="seat" />)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ COMBOS (ingressos) ============ */
function CombosSection({ onAddToCart }) {
  return (
    <section id="combos" className="py-24 bg-black">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <SectionTitle eyebrow="Snack bar e bomboniere" title="Combos e delícias" description="Pipocas aromatizadas, toppings gourmet e bebidas servidas na temperatura perfeita." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMBOS.map((c) => (
            <div key={c.id} className="ticket ticket-v group bg-[#1a1816] flex flex-col transition-transform duration-300 hover:-translate-y-1" style={{ "--n": "50%" }}>
              <div className="relative aspect-video overflow-hidden bg-black">
                <img src={c.image} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <Badge className="absolute top-3 left-3 bg-[#691528] text-[#FAD241] border border-[#FAD241]/30">{c.label}</Badge>
              </div>
              <div className="p-5 flex-grow">
                <h3 className="font-bold text-lg text-[#ECE1DC] mb-2">{c.title}</h3>
                <p className="text-xs text-[#ECE1DC]/55 leading-relaxed">{c.description}</p>
              </div>
              <div className="tear mx-5" />
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#ECE1DC]/40 block">Valor</span>
                  <span className="f-display text-3xl font-black text-[#FAD241]">{c.priceFormatted}</span>
                </div>
                <Button variant="wine" size="sm" onClick={() => onAddToCart(c)}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ MODAIS ============ */
function TrailerModal({ movie, onClose }) {
  if (!movie) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold text-[#FAD241] block">Trailer oficial</span>
            <h3 className="f-display text-3xl font-black text-[#ECE1DC]">{movie.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-2 text-white/60 hover:text-white rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex gap-2 bg-[#0c0b0a] p-3 rounded-md border border-white/10">
          <div className="perf-v hidden sm:block rounded-sm" />
          <div className="aspect-video w-full bg-black">
            <iframe src={`${movie.trailerUrl}?autoplay=1`} title={movie.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          <div className="perf-v hidden sm:block rounded-sm" />
        </div>
      </div>
    </div>
  );
}

function TicketBookingModal({ movie, onClose, onAddToCart }) {
  const [date, setDate] = useState("Hoje");
  const [session, setSession] = useState(movie?.sessions?.[0] || "18:00");
  const [count, setCount] = useState(2);
  const [type, setType] = useState("inteira");
  if (!movie) return null;

  const unit = type === "inteira" ? 38 : 19;
  const total = (unit * count).toFixed(2).replace(".", ",");

  const confirm = () => {
    onAddToCart({
      id: `ticket-${movie.id}-${Date.now()}`,
      title: `Ingresso: ${movie.title}`,
      description: `${date} às ${session} (${count}x ${type})`,
      price: unit * count,
      priceFormatted: `R$ ${total}`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ticket w-full max-w-3xl grid md:grid-cols-[1fr_220px] bg-[#16140f]" style={{ "--n": "50%" }}>
        {/* canhoto principal */}
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-[#FAD241]/10 text-[#FAD241] border border-[#FAD241]/30">Compra rápida</Badge>
            <button onClick={onClose} aria-label="Fechar" className="p-1 text-white/50 hover:text-white md:hidden"><X className="w-5 h-5" /></button>
          </div>
          <h3 className="f-display text-4xl md:text-5xl font-black text-[#ECE1DC] mb-6 leading-none">{movie.title}</h3>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-white/50 block mb-2">Data</label>
              <div className="flex gap-2 flex-wrap">
                {["Hoje", "Amanhã", "Sáb, 28 Set"].map((d) => (
                  <Button key={d} size="sm" variant={date === d ? "wine" : "outline"} onClick={() => setDate(d)}><CalendarDays className="w-3.5 h-3.5 mr-1.5" />{d}</Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 block mb-2">Horário da sessão</label>
              <div className="flex gap-2 flex-wrap">
                {(movie.sessions || ["18:00", "20:30"]).map((s) => (
                  <Button key={s} size="sm" variant={session === s ? "default" : "outline"} onClick={() => setSession(s)}>{s}</Button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/50 block mb-2">Tipo de entrada</label>
                <div className="flex gap-2">
                  <Button size="sm" variant={type === "inteira" ? "wine" : "outline"} onClick={() => setType("inteira")} className="flex-1">Inteira R$ 38</Button>
                  <Button size="sm" variant={type === "meia" ? "wine" : "outline"} onClick={() => setType("meia")} className="flex-1">Meia R$ 19</Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 block mb-2">Quantidade</label>
                <div className="flex items-center justify-between border border-white/10 rounded-full p-1 bg-white/5">
                  <Button size="icon" variant="ghost" aria-label="Menos" onClick={() => setCount((p) => Math.max(1, p - 1))}><Minus className="w-4 h-4" /></Button>
                  <span className="font-bold text-[#FAD241]">{count}</span>
                  <Button size="icon" variant="ghost" aria-label="Mais" onClick={() => setCount((p) => p + 1)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* canhoto destacável */}
        <div className="tear tear-v md:border-t-0 bg-[#691528]/30 p-6 flex flex-col justify-between gap-6">
          <button onClick={onClose} aria-label="Fechar" className="self-end p-1 text-white/50 hover:text-white hidden md:block"><X className="w-5 h-5" /></button>
          <div className="text-xs text-[#ECE1DC]/70 space-y-1">
            <p className="font-bold text-[#ECE1DC]">{date} · {session}</p>
            <p>{count}x {type}</p>
          </div>
          <div>
            <span className="text-xs text-white/50 block">Total do pedido</span>
            <span className="f-display text-5xl font-black text-[#FAD241]">R$ {total}</span>
          </div>
          <Barcode seed={movie.title.length} />
          <Button onClick={confirm} className="w-full">Adicionar ao pedido</Button>
        </div>
      </div>
    </div>
  );
}

/* ============ PÁGINA ============ */
export default function CineAstraApp() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [bookingMovie, setBookingMovie] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => setCartItems((p) => [...p, item]);

  const filtered = NOW_PLAYING.filter((m) =>
    selectedCategory === "Todos" || m.category === selectedCategory
  );

  return (
    <div className="ca-root min-h-screen bg-black text-[#ECE1DC] selection:bg-[#691528] selection:text-[#FAD241]">
      <CinemaStyles />
      <HeroSection onOpenTrailer={setTrailerMovie} onSelectMovie={setBookingMovie} />

      <section id="em-cartaz" className="py-20 max-w-[1600px] mx-auto px-5 md:px-8">
        <SectionTitle eyebrow="Programação" title="Em cartaz hoje" description="Escolha seu filme e garanta os melhores assentos, com som tridimensional e imagem ultra nítida." />
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {CATEGORIES.map((cat) => (
            <Button key={cat} variant={selectedCategory === cat ? "wine" : "outline"} onClick={() => setSelectedCategory(cat)} className={`shrink-0 ${selectedCategory === cat ? "border border-[#FAD241]/40 !text-[#FAD241]" : ""}`}>{cat}</Button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="text-center py-16 text-white/40 text-sm">Nenhum filme encontrado. Tente outra categoria.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filtered.map((m) => <PosterCard key={m.id} movie={m} onSelectMovie={setBookingMovie} />)}
          </div>
        )}
      </section>

      <ExperienceSection />
      <CombosSection onAddToCart={addToCart} />

      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
      <TicketBookingModal key={bookingMovie?.id} movie={bookingMovie} onClose={() => setBookingMovie(null)} onAddToCart={addToCart} />

      <footer className="bg-[#0b0a09] pb-10 text-xs text-white/40">
        <div className="perf mb-10" />
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Projector className="w-10 text-[#FAD241]" />
            <span className="f-display text-3xl font-black text-[#ECE1DC]">CINEASTRA VIP</span>
          </div>
          <p>© {new Date().getFullYear()} CineAstra Redes de Cinema. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}