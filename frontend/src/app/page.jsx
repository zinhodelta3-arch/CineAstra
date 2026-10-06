"use client";
import Image from "next/image";
import Footer from "@/components/Footer";
import React, { useState, useEffect } from "react";
import {
  Film, Ticket, Star, Clock3, CalendarDays, Play,
  ChevronLeft, ChevronRight, Sparkles, ArrowRight, Plus, Minus, Check,
  Volume2, Tv2, Crown, Trash2, X, ShoppingBag,
} from "lucide-react";

/* ============ DADOS ============ */
const U = (id, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

const HERO_MOVIES = [
  { id: "hero-1", title: "O Último Fotograma", subtitle: "Algumas histórias só terminam quando alguém as assiste até o fim.", genre: "Suspense · Drama", duration: "2h 08min", rating: "14 anos", score: "4.9", format: "IMAX 3D · DOLBY ATMOS", image: U("photo-1478720568477-152d9b164e26", 2200), poster: U("photo-1478720568477-152d9b164e26"), synopsis: "Um misterioso fotógrafo descobre rolos de filme não revelados em um estúdio abandonado, revelando eventos que reescrevem o passado e ameaçam o futuro.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["14:30", "17:15", "20:00", "22:30"] },
  { id: "hero-2", title: "Constelação Kira", subtitle: "O universo respondeu. Agora precisamos descobrir o que ele disse.", genre: "Ficção Científica · Aventura", duration: "2h 21min", rating: "12 anos", score: "4.8", format: "IMAX 4K · D-BOX", image: U("photo-1446776811953-b23d57bd21aa", 2200), poster: U("photo-1440404653325-ab127d49abc1"), synopsis: "Uma expedição interestelar parte para investigar um sinal emitido das profundezas de uma nebulosa, onde as leis da física conhecidas não se aplicam.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["15:00", "18:20", "21:10"] },
  { id: "hero-3", title: "Baile das Sombras", subtitle: "Depois da meia-noite, ninguém deveria estar olhando para trás.", genre: "Terror · Mistério", duration: "1h 54min", rating: "16 anos", score: "4.7", format: "4K · ATMOS", image: U("photo-1489599849927-2ee91cede3ba", 2200), poster: U("photo-1497032205916-ac775f0649ae"), synopsis: "Em uma mansão vitoriana isolada, convidados para um baile de máscaras percebem que seus anfitriões pertencem a uma ordem esquecida no tempo.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["18:00", "20:30", "22:50"] },
];

const CATEGORIES = ["Todos", "Lançamentos", "Ação", "Drama", "Comédia", "Terror", "Ficção Científica", "Animação"];

const NOW_PLAYING = [
  { id: "m-1", title: "O Último Fotograma", genre: "Suspense", score: "4.9", age: "14", duration: "2h 08min", category: "Lançamentos", poster: U("photo-1478720568477-152d9b164e26"), sessions: ["14:30", "17:15", "20:00", "22:30"] },
  { id: "m-2", title: "Constelação Kira", genre: "Ficção Científica", score: "4.8", age: "12", duration: "2h 21min", category: "Ficção Científica", poster: U("photo-1440404653325-ab127d49abc1"), sessions: ["15:00", "18:20", "21:10"] },
  { id: "m-3", title: "Maré Vermelha", genre: "Ação", score: "4.6", age: "16", duration: "2h 01min", category: "Ação", poster: U("photo-1518709268805-4e9042af9f23"), sessions: ["13:40", "16:15", "19:00", "21:45"] },
  { id: "m-4", title: "Baile das Sombras", genre: "Terror", score: "4.7", age: "16", duration: "1h 54min", category: "Terror", poster: U("photo-1497032205916-ac775f0649ae"), sessions: ["18:00", "20:30", "22:50"] },
  { id: "m-5", title: "Sete Invernos", genre: "Drama", score: "4.5", age: "12", duration: "1h 58min", category: "Drama", poster: U("photo-1500530855697-b586d89ba3ee"), sessions: ["14:00", "16:40", "19:20"] },
  { id: "m-6", title: "O Segredo de Gaia", genre: "Animação", score: "4.9", age: "Livre", duration: "1h 38min", category: "Animação", poster: U("photo-1534447677768-be436bb09401"), sessions: ["11:00", "13:15", "15:30", "17:45"] },
];

const COMBOS = [
  { id: "c-1", title: "Combo CineAstra Supreme", description: "1 Pipoca Balde Especial + 2 Refrigerantes 1L + 1 M&M's Gigante", price: 52.9, priceFormatted: "R$ 52,90", label: "Mais vendido", image: U("photo-1585647347384-2593bc35786b", 1000) },
  { id: "c-2", title: "Combo Duo Gold", description: "1 Pipoca Grande + 2 Bebidas 700ml + 1 Nachos com Queijo", price: 44.9, priceFormatted: "R$ 44,90", label: "Para dois", image: U("photo-1578849278619-74b2c2bc9852", 1000) },
  { id: "c-3", title: "Pipoca Caramelizada Gourmet", description: "Pipoca crocante envolvida em caramelo artesanal e flor de sal", price: 28.9, priceFormatted: "R$ 28,90", label: "Gourmet", image: U("photo-1588614959060-4d144f28b207", 1000) },
  { id: "c-4", title: "Sweet Cinema Deluxe", description: "Chocolates importados + Balas de Goma + Refrigerante 500ml", price: 32.9, priceFormatted: "R$ 32,90", label: "Sobremesa", image: U("photo-1578985545062-69928b1d9587", 1000) },
];

const formatBRL = (value) => `R$ ${value.toFixed(2).replace(".", ",")}`;

/* ============ ESTILOS ============ */
const CinemaStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');

    .ca-root { font-family: var(--font-sans, 'Manrope', sans-serif); }
    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }

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

    .screen-curve { border-radius: 50% 50% 0 0/14% 14% 0 0; box-shadow: 0 -20px 60px -10px var(--primary); }
    .seat { width: 16px; height: 12px; border-radius: 5px 5px 2px 2px; background: var(--secondary); opacity: .8; }
  `}</style>
);

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
  let base = "inline-flex items-center justify-center font-bold transition-all rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ";

  if (variant === "default") base += "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 ";
  if (variant === "wine") base += "bg-secondary text-secondary-foreground hover:opacity-90 ";
  if (variant === "outline") base += "border border-border bg-background/50 text-foreground hover:border-primary hover:text-primary ";
  if (variant === "ghost") base += "text-muted-foreground hover:text-foreground hover:bg-muted/50 ";
  if (variant === "link") base += "text-primary hover:underline p-0 h-auto ";

  if (size === "sm") base += "px-3 py-1.5 text-xs ";
  if (size === "default") base += "px-6 py-3 text-sm ";
  if (size === "lg") base += "px-8 py-4 text-base ";
  if (size === "icon") base += "p-2.5 ";

  return <button type={type} className={`${base} ${className}`} {...props}>{children}</button>;
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-10 flex items-start gap-4">
      <div className="hidden sm:block perf-v self-stretch rounded-sm" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
          <Film className="w-4 h-4" aria-hidden="true" /> {eyebrow}
        </div>
        <h2 className="f-display text-5xl md:text-7xl font-black text-foreground leading-[0.95]">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">{description}</p>}
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
    <section id="hero" className="grain relative min-h-[88vh] lg:min-h-[94vh] bg-background flex items-end pt-12 overflow-hidden border-b border-border">
      {HERO_MOVIES.map((m, i) => (
        <div key={m.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === cur ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${m.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>
      ))}
      <Image
        src="/Logominimalista.png"
        alt=""
        aria-hidden="true"
        width={200}
        height={260}
        priority
        className="pointer-events-none absolute top-6 right-[1%] z-10 hidden h-auto w-28 opacity-19 md:block md:w-40"
      />

      <div className="perf absolute top-0 inset-x-0 z-20" aria-hidden="true" />
      <div className="perf absolute bottom-0 inset-x-0 z-20" aria-hidden="true" />

      <div className="relative z-20 max-w-[1600px] mx-auto px-5 md:px-8 pb-20 pt-12 w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <Badge className="bg-primary/15 border border-primary/40 text-primary">
                <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" /> Estreia em destaque
              </Badge>
              <Badge className="bg-secondary text-secondary-foreground text-[11px]">{movie.format}</Badge>
            </div>
            <p className="text-primary font-semibold text-sm mb-3 max-w-lg">{movie.subtitle}</p>
            <h1 className="f-display text-5xl sm:text-7xl lg:text-[7rem] font-black text-foreground uppercase leading-[0.85] mb-6">{movie.title}</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-6 line-clamp-3 leading-relaxed">{movie.synopsis}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 flex-wrap">
              <span className="flex items-center text-primary font-bold"><Star className="w-4 h-4 fill-current mr-1" aria-hidden="true" />{movie.score}</span>
              <span className="flex items-center"><Clock3 className="w-4 h-4 mr-1 opacity-70" aria-hidden="true" />{movie.duration}</span>
              <span>{movie.genre}</span>
              <span className="px-2 py-0.5 rounded border border-border text-[11px] font-bold">{movie.rating}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button size="lg" onClick={() => onSelectMovie(movie)}><Ticket className="w-5 h-5 mr-2" aria-hidden="true" /> Garantir ingressos</Button>
              <Button size="lg" variant="outline" onClick={() => onOpenTrailer(movie)}><Play className="w-5 h-5 mr-2 fill-current" aria-hidden="true" /> Assistir trailer</Button>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-start lg:items-end">
            <div className="flex items-center gap-3 mb-5">
              <Button size="icon" variant="outline" aria-label="Anterior" onClick={() => setCur((p) => (p === 0 ? HERO_MOVIES.length - 1 : p - 1))}><ChevronLeft className="w-6 h-6" /></Button>
              <Button size="icon" variant="outline" aria-label="Próximo" onClick={() => setCur((p) => (p + 1) % HERO_MOVIES.length)}><ChevronRight className="w-6 h-6" /></Button>
            </div>
            <div className="flex gap-2 bg-card/80 backdrop-blur-md border border-border p-2 rounded-md">
              {HERO_MOVIES.map((m, i) => (
                <button key={m.id} type="button" onClick={() => setCur(i)} aria-label={m.title}
                  className={`w-20 h-28 overflow-hidden rounded-sm border-2 transition-all ${i === cur ? "border-primary shadow-lg shadow-primary/30" : "border-transparent opacity-50 hover:opacity-100"}`}>
                  <img src={m.poster} alt="" className="w-full h-full object-cover" />
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
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectMovie(movie)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectMovie(movie))}
      className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus:outline-none flex flex-col h-full"
    >
      <div className="perf !rounded-none" aria-hidden="true" />
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img src={movie.poster} alt={`Pôster de ${movie.title}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-md border border-border text-foreground">{movie.age}</Badge>
        <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-md border border-primary/40 text-primary font-bold">
          <Star className="w-3 h-3 fill-current mr-1" aria-hidden="true" />{movie.score}
        </Badge>
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center p-4 backdrop-blur-sm">
          <span className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
            <Ticket className="w-4 h-4 mr-1.5" aria-hidden="true" /> Comprar
          </span>
        </div>
      </div>
      <div className="perf !rounded-none" aria-hidden="true" />
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <span className="text-xs font-semibold text-primary block mb-1">{movie.genre}</span>
          <h3 className="font-bold text-base text-card-foreground group-hover:text-primary transition-colors line-clamp-1">{movie.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center"><Clock3 className="w-3 h-3 mr-1" aria-hidden="true" />{movie.duration}</p>
        </div>
        <div className="mt-4 pt-3 tear">
          <p className="text-xs text-muted-foreground mb-2">Próximas sessões</p>
          <div className="flex gap-1.5 flex-wrap">
            {movie.sessions.slice(0, 3).map((t) => (
              <span key={t} className="px-2 py-1 rounded-sm bg-secondary/20 border border-secondary/40 text-[11px] font-bold text-foreground group-hover:text-primary">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ EXPERIÊNCIA ============ */
const FEATURES = {
  imax: { icon: Tv2, label: "IMAX 4K Laser", title: "CineAstra IMAX® 4K Laser", description: "Telas gigantescas do chão ao teto e da parede à parede, com projeção laser dupla 4K para uma nitidez sem precedentes.", tags: ["Telas curvas de 24m", "Projeção laser 4K", "Assentos reclináveis premium"], image: U("photo-1489599849927-2ee91cede3ba", 1600) },
  atmos: { icon: Volume2, label: "Dolby Atmos®", title: "Som imersivo Dolby Atmos®", description: "64 canais de áudio independentes com alto-falantes no teto que fazem o som se mover ao seu redor com precisão tridimensional.", tags: ["Som 360° tridimensional", "Subwoofers duplos", "Isolamento acústico VIP"], image: U("photo-1517604931442-7e0c8ed2963c", 1600) },
  vip: { icon: Crown, label: "Gold Class VIP", title: "Salas VIP Gold Class Lounge", description: "Poltronas duplas de couro reclináveis eletricamente, com serviço de garçom acionado por botão direto no assento.", tags: ["Atendimento no assento", "Carta de vinhos e cocktails", "Poltronas chaise longue"], image: U("photo-1585647347384-2593bc35786b", 1600) },
};

function ExperienceSection() {
  const [tab, setTab] = useState("imax");
  const item = FEATURES[tab];

  return (
    <section id="experiencia" className="grain relative py-24 bg-card border-y border-border overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8 relative z-10">
        <SectionTitle eyebrow="Tecnologia de ponta" title="A experiência CineAstra" description="Transformamos o simples ato de ir ao cinema em uma jornada sensorial, com os mais elevados padrões mundiais." />

        <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
          {Object.entries(FEATURES).map(([key, f]) => (
            <Button key={key} variant={tab === key ? "wine" : "outline"} onClick={() => setTab(key)} className={`shrink-0 ${tab === key ? "border border-primary/40 !text-primary" : ""}`}>
              <f.icon className="w-4 h-4 mr-2" aria-hidden="true" /> {f.label}
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <h3 className="f-display text-5xl md:text-6xl font-black text-foreground leading-[0.95] mb-4">{item.title}</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">{item.description}</p>
            <div className="space-y-3 mb-8">
              {item.tags.map((tag) => (
                <div key={tag} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"><Check className="w-3 h-3" aria-hidden="true" /></span>
                  {tag}
                </div>
              ))}
            </div>
            <Button>Conhecer programação VIP <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" /></Button>
          </div>

          <div className="lg:col-span-7">
            <div className="screen-curve overflow-hidden border-t-4 border-x-4 border-border bg-background aspect-[16/8] relative">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
            <div className="mx-auto w-[88%] h-6 bg-gradient-to-b from-primary/20 to-transparent blur-md" aria-hidden="true" />
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

/* ============ COMBOS ============ */
function CombosSection({ onAddToCart }) {
  return (
    <section id="combos" className="py-24 bg-background">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <SectionTitle eyebrow="Snack bar e bomboniere" title="Combos e delícias" description="Pipocas aromatizadas, toppings gourmet e bebidas servidas na temperatura perfeita." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMBOS.map((c) => (
            <div key={c.id} className="ticket ticket-v group bg-card border border-border flex flex-col transition-transform duration-300 hover:-translate-y-1" style={{ "--n": "50%" }}>
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img src={c.image} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground border border-primary/30">{c.label}</Badge>
              </div>
              <div className="p-5 flex-grow">
                <h3 className="font-bold text-lg text-card-foreground mb-2">{c.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
              </div>
              <div className="tear mx-5" />
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">Valor</span>
                  <span className="f-display text-3xl font-black text-primary">{c.priceFormatted}</span>
                </div>
                <Button variant="wine" size="sm" onClick={() => onAddToCart(c)}><Plus className="w-4 h-4 mr-1" aria-hidden="true" /> Adicionar</Button>
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
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Trailer de ${movie.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold text-primary block">Trailer oficial</span>
            <h3 className="f-display text-3xl font-black text-foreground">{movie.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-muted-foreground hover:text-foreground rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex gap-2 bg-card p-3 rounded-md border border-border">
          <div className="perf-v hidden sm:block rounded-sm" aria-hidden="true" />
          <div className="aspect-video w-full bg-black">
            <iframe src={`${movie.trailerUrl}?autoplay=1`} title={movie.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          <div className="perf-v hidden sm:block rounded-sm" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function TicketBookingModal({ movie, onClose, onAddToCart }) {
  const sessions = movie.sessions?.length ? movie.sessions : ["18:00", "20:30"];
  const [date, setDate] = useState("Hoje");
  const [session, setSession] = useState(sessions[0]);
  const [count, setCount] = useState(2);
  const [type, setType] = useState("inteira");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const unit = type === "inteira" ? 38 : 19;
  const totalValue = unit * count;

  const confirm = () => {
    onAddToCart({
      id: `ticket-${movie.id}-${Date.now()}`,
      title: `Ingresso: ${movie.title}`,
      description: `${date} às ${session} (${count}x ${type})`,
      price: totalValue,
      priceFormatted: formatBRL(totalValue),
    });
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Comprar ingresso de ${movie.title}`} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ticket w-full max-w-3xl grid md:grid-cols-[1fr_220px] bg-card border border-border rounded-xl shadow-2xl" style={{ "--n": "50%" }}>
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-primary/10 text-primary border border-primary/30">Compra rápida</Badge>
            <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 text-muted-foreground hover:text-foreground md:hidden"><X className="w-5 h-5" /></button>
          </div>
          <h3 className="f-display text-4xl md:text-5xl font-black text-card-foreground mb-6 leading-none">{movie.title}</h3>

          <div className="space-y-5">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-2">Data</span>
              <div className="flex gap-2 flex-wrap">
                {["Hoje", "Amanhã", "Sáb, 28 Set"].map((d) => (
                  <Button key={d} size="sm" variant={date === d ? "wine" : "outline"} onClick={() => setDate(d)}>
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />{d}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-2">Horário da sessão</span>
              <div className="flex gap-2 flex-wrap">
                {sessions.map((s) => (
                  <Button key={s} size="sm" variant={session === s ? "default" : "outline"} onClick={() => setSession(s)}>{s}</Button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-2">Tipo de entrada</span>
                <div className="flex gap-2">
                  <Button size="sm" variant={type === "inteira" ? "wine" : "outline"} onClick={() => setType("inteira")} className="flex-1">Inteira R$ 38</Button>
                  <Button size="sm" variant={type === "meia" ? "wine" : "outline"} onClick={() => setType("meia")} className="flex-1">Meia R$ 19</Button>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-2">Quantidade</span>
                <div className="flex items-center justify-between border border-border rounded-full p-1 bg-muted/30">
                  <Button size="icon" variant="ghost" aria-label="Menos" onClick={() => setCount((p) => Math.max(1, p - 1))}><Minus className="w-4 h-4" /></Button>
                  <span className="font-bold text-primary" aria-live="polite">{count}</span>
                  <Button size="icon" variant="ghost" aria-label="Mais" onClick={() => setCount((p) => p + 1)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tear tear-v md:border-t-0 bg-secondary/15 p-6 flex flex-col justify-between gap-6">
          <button type="button" onClick={onClose} aria-label="Fechar" className="self-end p-1 text-muted-foreground hover:text-foreground hidden md:block"><X className="w-5 h-5" /></button>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">{date} · {session}</p>
            <p>{count}x {type}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Total do pedido</span>
            <span className="f-display text-5xl font-black text-primary">{formatBRL(totalValue)}</span>
          </div>
          <Barcode seed={movie.title.length} />
          <Button onClick={confirm} className="w-full">Adicionar ao pedido</Button>
        </div>
      </div>
    </div>
  );
}

/* ============ CARRINHO ============ */
function CartDrawer({ items, onRemove, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = items.reduce((acc, item) => acc + (item.price || 0), 0);

  return (
    <div role="dialog" aria-modal="true" aria-label="Seu pedido" className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border-l border-border h-full p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="f-display text-3xl font-black text-foreground">Seu Pedido</h3>
            <button type="button" onClick={onClose} aria-label="Fechar carrinho" className="text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {items.length === 0 && <p className="text-sm text-muted-foreground">Seu pedido está vazio.</p>}
            {items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center justify-between gap-3 p-3 bg-muted/20 border border-border rounded-lg">
                <div>
                  <p className="font-bold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <span className="text-xs font-bold text-primary mt-1 block">{item.priceFormatted}</span>
                </div>
                <button type="button" onClick={() => onRemove(idx)} aria-label={`Remover ${item.title}`} className="text-destructive hover:opacity-80 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground text-sm">Total:</span>
            <span className="f-display text-3xl font-black text-primary">{formatBRL(total)}</span>
          </div>
          <Button className="w-full" size="lg" disabled={items.length === 0}>Finalizar Compra</Button>
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
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (item) => setCartItems((prev) => [...prev, item]);
  const handleRemoveFromCart = (index) => setCartItems((prev) => prev.filter((_, i) => i !== index));

  const filteredMovies = selectedCategory === "Todos"
    ? NOW_PLAYING
    : NOW_PLAYING.filter((m) => m.category === selectedCategory);

  return (
    <div className="ca-root min-h-screen bg-background text-foreground transition-colors duration-300">
      <CinemaStyles />

      <HeroSection onOpenTrailer={setTrailerMovie} onSelectMovie={setBookingMovie} />

      <section id="em-cartaz" className="py-20 max-w-[1600px] mx-auto px-5 md:px-8">
        <SectionTitle
          eyebrow="Programação Semanal"
          title="Em Exibição"
          description="Confira os filmes em cartaz e escolha a melhor sessão para sua experiência cinematográfica."
        />

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {CATEGORIES.map((cat) => (
            <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setSelectedCategory(cat)}>
              {cat}
            </Button>
          ))}
        </div>

        {filteredMovies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum filme em cartaz nesta categoria no momento.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {filteredMovies.map((movie) => (
              <PosterCard key={movie.id} movie={movie} onSelectMovie={setBookingMovie} />
            ))}
          </div>
        )}
      </section>

      <ExperienceSection />
      <CombosSection onAddToCart={handleAddToCart} />

      {trailerMovie && <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />}
      {bookingMovie && (
        <TicketBookingModal
          key={bookingMovie.id}
          movie={bookingMovie}
          onClose={() => setBookingMovie(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button size="lg" onClick={() => setIsCartOpen(true)} className="shadow-2xl gap-2">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            <span>{cartItems.length} {cartItems.length === 1 ? "item" : "itens"}</span>
          </Button>
        </div>
      )}

      {isCartOpen && (
        <CartDrawer items={cartItems} onRemove={handleRemoveFromCart} onClose={() => setIsCartOpen(false)} />
      )}

      <Footer />
    </div>
  );
}