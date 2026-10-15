"use client";
import Image from "next/image";
import Footer from "@/components/Footer";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Film, Ticket, Star, Clock3, CalendarDays, Play,
  ChevronLeft, ChevronRight, Sparkles, ArrowRight, Plus, Minus, Check,
  Volume2, Tv2, Crown, Trash2, X, ShoppingBag, Popcorn, CupSoda, Cookie, IceCream, Armchair, Flame,
} from "lucide-react";

/* ============ DADOS ============ */
/* Recorte explícito (w x h) para cada uso, para as fotos nunca saírem esticadas ou fora de proporção */
const U = (id, w, h) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=80`;
const posterImg = (id) => U(id, 600, 900);              // pôster 2:3
const wideImg = (id, w = 1920, h = 1080) => U(id, w, h); // paisagem 16:9

/* Banco central de imagens por tema. Para trocar uma foto, altere só o ID aqui. */
const IMG = {
  // Cinema / salas
  cinemaHall: "photo-1489599849927-2ee91cede3ba",
  cinemaSeats: "photo-1517604931442-7e0c8ed2963c",
  vipSeats: "photo-1505686994434-e3cc5abf1330",
  projector: "photo-1485846234645-a62644f84728",
  filmReel: "photo-1536440136628-849c177e76a1",
  // Comidas e bebidas
  popcorn: "photo-1585647347384-2593bc35786b",
  caramelPopcorn: "photo-1578849278619-74b2c2bc9852",
  nachos: "photo-1513456852971-30c0b8199d4d",
  soda: "photo-1554866585-cd94860890b7",
  chocolate: "photo-1511381939415-e44015466834",
  candy: "photo-1582058091505-f87a2e55a40f",
  iceCream: "photo-1563805042-7684c019e1cb",
  hotdog: "photo-1612392062631-94dd858cba88",
  cookies: "photo-1499636136210-6f4ee915583e",
};

const HERO_MOVIES = [
  { id: "hero-1", title: "O Último Fotograma", subtitle: "Algumas histórias só terminam quando alguém as assiste até o fim.", genre: "Suspense · Drama", duration: "2h 08min", rating: "14 anos", score: "4.9", format: "IMAX 3D · DOLBY ATMOS", image: wideImg("photo-1478720568477-152d9b164e26"), poster: posterImg("photo-1478720568477-152d9b164e26"), synopsis: "Um misterioso fotógrafo descobre rolos de filme não revelados em um estúdio abandonado, revelando eventos que reescrevem o passado e ameaçam o futuro.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["14:30", "17:15", "20:00", "22:30"] },
  { id: "hero-2", title: "Constelação Kira", subtitle: "O universo respondeu. Agora precisamos descobrir o que ele disse.", genre: "Ficção Científica · Aventura", duration: "2h 21min", rating: "12 anos", score: "4.8", format: "IMAX 4K · D-BOX", image: wideImg("photo-1446776811953-b23d57bd21aa"), poster: posterImg("photo-1440404653325-ab127d49abc1"), synopsis: "Uma expedição interestelar parte para investigar um sinal emitido das profundezas de uma nebulosa, onde as leis da física conhecidas não se aplicam.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["15:00", "18:20", "21:10"] },
  { id: "hero-3", title: "Baile das Sombras", subtitle: "Depois da meia-noite, ninguém deveria estar olhando para trás.", genre: "Terror · Mistério", duration: "1h 54min", rating: "16 anos", score: "4.7", format: "4K · ATMOS", image: wideImg(IMG.cinemaHall), poster: posterImg("photo-1497032205916-ac775f0649ae"), synopsis: "Em uma mansão vitoriana isolada, convidados para um baile de máscaras percebem que seus anfitriões pertencem a uma ordem esquecida no tempo.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["18:00", "20:30", "22:50"] },
];

const S = ["13:40", "16:15", "19:00", "21:45"];

/* Em cartaz */
const NOW_PLAYING = [
  { id: "m-1", title: "Se Eu Fosse Você 3", genre: "Comédia", age: "10", duration: "90m", poster: posterImg("photo-1485846234645-a62644f84728"), sessions: ["14:30", "17:15", "20:00", "22:30"] },
  { id: "m-2", title: "Verity", genre: "Suspense", age: "16", duration: "120m", poster: posterImg("photo-1478720568477-152d9b164e26"), sessions: ["15:00", "18:20", "21:10"] },
  { id: "m-3", title: "Outra Mamãe", genre: "Terror", age: "18", duration: "95m", poster: posterImg("photo-1497032205916-ac775f0649ae"), sessions: ["18:00", "20:30", "22:50"] },
  { id: "m-4", title: "Minha Melhor Amiga", genre: "Comédia", age: "12", duration: "120m", poster: posterImg("photo-1500530855697-b586d89ba3ee"), sessions: ["14:00", "16:40", "19:20"] },
  { id: "m-5", title: "As Aventuras de Tadeo e a Lâmpada Mágica", genre: "Animação", age: "10", duration: "95m", poster: posterImg("photo-1534447677768-be436bb09401"), sessions: ["11:00", "13:15", "15:30", "17:45"] },
  { id: "m-6", title: "Constelação Kira", genre: "Ficção Científica", age: "12", duration: "141m", poster: posterImg("photo-1440404653325-ab127d49abc1"), sessions: ["15:00", "18:20", "21:10"] },
  { id: "m-7", title: "Maré Vermelha", genre: "Ação", age: "16", duration: "121m", poster: posterImg("photo-1518709268805-4e9042af9f23"), sessions: S },
  { id: "m-8", title: "O Último Fotograma", genre: "Drama", age: "14", duration: "128m", poster: posterImg("photo-1478720568477-152d9b164e26"), sessions: ["14:30", "17:15", "20:00", "22:30"] },
];

/* Em breve (pré-venda) */
const COMING_SOON = [
 { id: "s-1", title: "Vingadores: Doutor Destino", genre: "Fantasia", age: "14", duration: "132m",
  release: "Estreia 15 Out",
  poster: "/posters/DOUTOR.png",   // antes: posterImg("photo-...")
  sessions: ["16:00", "19:00", "21:30"] },
  { id: "s-2", title: "Rota de Colisão", genre: "Ação", age: "14", duration: "118m", release: "Estreia 22 Out", poster: posterImg("photo-1518709268805-4e9042af9f23"), sessions: ["16:00", "19:00", "21:30"] },
  { id: "s-3", title: "Máscara Vermelha", genre: "Terror", age: "18", duration: "104m", release: "Estreia 29 Out", poster: posterImg("photo-1497032205916-ac775f0649ae"), sessions: ["18:00", "20:30", "22:50"] },
  { id: "s-4", title: "Turnê Mundial ao Vivo", genre: "Show", age: "Livre", duration: "150m", release: "Estreia 05 Nov", poster: posterImg("photo-1514525253161-7a46d19cd819"), sessions: ["17:00", "20:00"] },
  { id: "s-5", title: "Coração de Inverno", genre: "Romance", age: "12", duration: "112m", release: "Estreia 12 Nov", poster: posterImg("photo-1500530855697-b586d89ba3ee"), sessions: ["16:00", "19:00", "21:30"] },
  { id: "s-6", title: "A Última Órbita", genre: "Ficção Científica", age: "12", duration: "138m", release: "Estreia 19 Nov", poster: posterImg("photo-1440404653325-ab127d49abc1"), sessions: ["15:30", "18:40", "21:50"] },
];

/* Cada item usa uma foto do que ele realmente é (pipoca = pipoca, bebida = bebida...) */
const COMBOS = [
  { id: "c-1", title: "Combo CineAstra Supreme", description: "1 Pipoca Balde Especial + 2 Refrigerantes 1L + 1 M&M's Gigante", price: 52.9, priceFormatted: "R$ 52,90", label: "Mais vendido", icon: Popcorn, image: wideImg(IMG.popcorn, 1000, 600) },
  { id: "c-2", title: "Combo Duo Gold", description: "1 Pipoca Grande + 2 Bebidas 700ml + 1 Nachos com Queijo", price: 44.9, priceFormatted: "R$ 44,90", label: "Para dois", icon: Popcorn, image: wideImg(IMG.nachos, 1000, 600) },
  { id: "c-3", title: "Pipoca Caramelizada Gourmet", description: "Pipoca crocante envolvida em caramelo artesanal e flor de sal", price: 28.9, priceFormatted: "R$ 28,90", label: "Gourmet", icon: Popcorn, image: wideImg(IMG.popcorn, 1000, 600) },
  { id: "c-4", title: "Sweet Cinema Deluxe", description: "Chocolates importados + Balas de Goma + Refrigerante 500ml", price: 32.9, priceFormatted: "R$ 32,90", label: "Sobremesa", icon: Cookie, image: wideImg(IMG.chocolate, 1000, 600) },
  { id: "c-5", title: "Refri Gelado 700ml", description: "Refrigerante sabores variados, servido na temperatura perfeita, com gelo", price: 14.9, priceFormatted: "R$ 14,90", label: "Bebida", icon: CupSoda, image: wideImg(IMG.soda, 1000, 600) },
  { id: "c-6", title: "Cachorro-quente da Sessão", description: "Pão macio, salsicha artesanal, molho da casa e batata palha", price: 19.9, priceFormatted: "R$ 19,90", label: "Lanche", icon: Popcorn, image: wideImg(IMG.hotdog, 1000, 600) },
  { id: "c-7", title: "Sorvete Cremoso", description: "Duas bolas de sorvete artesanal com calda e cobertura crocante", price: 18.9, priceFormatted: "R$ 18,90", label: "Gelado", icon: IceCream, image: wideImg(IMG.iceCream, 1000, 600) },
  { id: "c-8", title: "Cookies Recheados", description: "Trio de cookies quentinhos com gotas de chocolate belga", price: 16.9, priceFormatted: "R$ 16,90", label: "Doce", icon: Cookie, image: wideImg(IMG.cookies, 1000, 600) },
];

/* Galeria de ambientes (cada foto combina com a legenda) */
const GALLERY = [
  { id: "g-1", title: "Sala IMAX", caption: "Tela gigante, projeção laser 4K", icon: Tv2, image: wideImg(IMG.cinemaHall, 900, 700) },
  { id: "g-2", title: "Poltronas reclináveis", caption: "Conforto do início ao fim", icon: Armchair, image: wideImg(IMG.cinemaSeats, 900, 700) },
  { id: "g-3", title: "Projeção", caption: "Cabine com tecnologia de ponta", icon: Film, image: wideImg(IMG.projector, 900, 700) },
  { id: "g-4", title: "Bomboniere", caption: "Pipoca fresquinha a cada sessão", icon: Popcorn, image: wideImg(IMG.popcorn, 900, 700) },
];

const formatBRL = (value) => `R$ ${value.toFixed(2).replace(".", ",")}`;

/* ============ ESTILOS ============ */
const CinemaStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap');

    .ca-root { font-family: var(--font-sans, 'Manrope', sans-serif); }
    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }

    .f-title { font-family: 'Oswald', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
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

    .screen-curve { border-radius: 50% 50% 0 0/14% 14% 0 0; box-shadow: 0 -24px 70px -26px color-mix(in oklab, var(--primary) 45%, transparent); }

    /* Degradês suaves, com várias paradas (sem corte seco), derivados do tema */
    .hero-scrim-x {
      background: linear-gradient(90deg,
        var(--background) 0%,
        color-mix(in oklab, var(--background) 94%, transparent) 20%,
        color-mix(in oklab, var(--background) 76%, transparent) 38%,
        color-mix(in oklab, var(--background) 48%, transparent) 55%,
        color-mix(in oklab, var(--background) 20%, transparent) 75%,
        color-mix(in oklab, var(--background) 6%, transparent) 90%,
        transparent 100%);
    }
    .hero-scrim-y {
      background: linear-gradient(180deg,
        color-mix(in oklab, var(--background) 55%, transparent) 0%,
        transparent 24%,
        transparent 52%,
        color-mix(in oklab, var(--background) 45%, transparent) 70%,
        color-mix(in oklab, var(--background) 82%, transparent) 88%,
        var(--background) 100%);
    }
    .hero-tint {
      background:
        radial-gradient(90% 70% at 88% 12%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 62%),
        radial-gradient(70% 60% at 0% 100%, color-mix(in oklab, var(--secondary) 22%, transparent), transparent 65%);
    }
    .poster-scrim {
      background: linear-gradient(0deg,
        color-mix(in oklab, var(--background) 90%, transparent) 0%,
        color-mix(in oklab, var(--background) 42%, transparent) 26%,
        transparent 55%);
    }

    /* Transição suave entre o hero e a próxima seção */
    .hero-bottom-fade {
      height: 9rem;
      background: linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--background) 60%, transparent) 55%, var(--background) 100%);
    }

    /* Divisor leve entre seções: linha de luz + brilho difuso */
    .section-sep { position: relative; height: 1px; background: linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--primary) 45%, transparent) 50%, transparent 100%); }
    .section-sep::after {
      content: ""; position: absolute; left: 12%; right: 12%; top: -14px; height: 28px; pointer-events: none;
      background: radial-gradient(60% 100% at 50% 50%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 75%);
    }

    /* Bordas superior/inferior de seção que "derretem" no fundo */
    .edge-fade-top::before, .edge-fade-bottom::after { content: ""; position: absolute; left: 0; right: 0; height: 7rem; pointer-events: none; z-index: 1; }
    .edge-fade-top::before { top: 0; background: linear-gradient(180deg, var(--background), transparent); }
    .edge-fade-bottom::after { bottom: 0; background: linear-gradient(0deg, var(--background), transparent); }

    .seat { width: 16px; height: 12px; border-radius: 5px 5px 2px 2px; background: var(--secondary); opacity: .8; }
  `}</style>
);

/* ============ COMPONENTES AUXILIARES ============ */
const Barcode = ({ seed = 7, className = "h-10" }) => (
  <div className={`flex items-end gap-[2px] ${className}`} aria-hidden="true">
    {Array.from({ length: 34 }).map((_, i) => (
      <span key={i} className="bg-foreground/70" style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
    ))}
  </div>
);

function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}

function SectionDivider() {
  return <div className="section-sep mx-auto max-w-[1600px]" aria-hidden="true" />;
}

/* Imagem com carregamento lento e fallback elegante (nunca mostra o ícone de imagem quebrada) */
function SmartImg({ src, alt = "", title = "", icon: Icon, className = "w-full h-full object-cover" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed || !src) {
    return (
      <div role="img" aria-label={alt || title} className={`${className} relative flex items-end p-3 bg-gradient-to-br from-secondary via-card to-background`}>
        {Icon && <Icon className="absolute top-3 right-3 w-8 h-8 text-primary/60" aria-hidden="true" />}
        <span className="f-display text-sm sm:text-base font-black uppercase leading-tight text-foreground/90 line-clamp-3">{title}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} />;
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
    <section id="hero" className="grain relative min-h-[88vh] lg:min-h-[94vh] bg-background flex items-end pt-12 overflow-hidden">
      {HERO_MOVIES.map((m, i) => (
        <div key={m.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === cur ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-card to-background" />
          <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${m.image})`, backgroundPosition: "72% center" }} />
          <div className="absolute inset-0 hero-scrim-x" />
          <div className="absolute inset-0 hero-scrim-y" />
          <div className="absolute inset-0 hero-tint" />
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
      {/* Fade inferior: o hero se dissolve suavemente no fundo da próxima seção */}
      <div className="hero-bottom-fade absolute bottom-0 inset-x-0 z-[15] pointer-events-none" aria-hidden="true" />

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
                  <SmartImg src={m.poster} title={m.title} icon={Film} />
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
const AGE_STYLES = {
  Livre: "bg-emerald-600 text-white",
  "10": "bg-sky-500 text-white",
  "12": "bg-yellow-400 text-black",
  "14": "bg-orange-500 text-white",
  "16": "bg-red-600 text-white",
  "18": "bg-black text-white border border-border",
};

function AgeBadge({ age }) {
  return (
    <span aria-label={`Classificação ${age}`} className={`inline-flex min-w-[28px] h-6 px-1.5 items-center justify-center rounded-md text-xs font-bold ${AGE_STYLES[age] || "bg-muted text-foreground"}`}>
      {age}
    </span>
  );
}

function PosterCard({ movie, onSelectMovie, soon = false }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectMovie(movie)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectMovie(movie))}
      style={{ "--n": "50%" }}
      className="ticket ticket-v group h-full bg-card border border-border cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary focus:outline-none flex flex-col"
    >
      <div className="perf !rounded-none" aria-hidden="true" />
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <SmartImg src={movie.poster} alt={`Pôster de ${movie.title}`} title={movie.title} icon={Film} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 poster-scrim" aria-hidden="true" />
        {soon ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-lg bg-red-700 px-2.5 py-1.5 text-xs font-bold uppercase text-white shadow-lg f-title">
            <Flame className="w-3.5 h-3.5" aria-hidden="true" /> Pré-venda
          </span>
        ) : (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-lg bg-background/70 backdrop-blur-md border border-border px-2.5 py-1.5 text-xs font-bold text-foreground f-title">
            Assista agora
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-end justify-center p-4">
          <span className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            <Ticket className="w-4 h-4 mr-1.5" aria-hidden="true" /> {soon ? "Garantir pré-venda" : "Comprar ingresso"}
          </span>
        </div>
      </div>
      <div className="perf !rounded-none" aria-hidden="true" />

      <div className="px-3 pt-3 pb-2">
        <span className="text-xs font-semibold text-primary block mb-1">{movie.genre} · {movie.duration}</span>
        <h3 className="f-title uppercase text-sm leading-tight text-card-foreground line-clamp-2 min-h-[2.25rem] group-hover:text-primary transition-colors">{movie.title}</h3>
      </div>

      <div className="tear mx-3" aria-hidden="true" />

      <div className="px-3 py-2.5 flex-grow flex flex-col justify-between gap-3">
        {soon ? (
          <p className="text-xs font-semibold text-foreground flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1.5 text-primary" aria-hidden="true" />{movie.release}</p>
        ) : (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Próximas sessões</p>
            <div className="flex gap-1.5 flex-wrap">
              {movie.sessions.slice(0, 3).map((t) => (
                <span key={t} className="px-2 py-1 rounded-sm bg-secondary/20 border border-secondary/40 text-[11px] font-bold text-foreground group-hover:text-primary">{t}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <Barcode seed={movie.title.length} className="h-6 opacity-60" />
          <AgeBadge age={movie.age} />
        </div>
      </div>
    </div>
  );
}

/* Carrossel horizontal com setas e indicador de páginas */
function MovieCarousel({ id, title, movies, soon = false, onSelectMovie }) {
  const ref = useRef(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05));
    const max = el.scrollWidth - el.clientWidth;
    setPages(total);
    setPage(max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (total - 1)));
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, movies]);

  const go = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });
  const goTo = (i) => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: pages > 1 ? (max / (pages - 1)) * i : 0, behavior: "smooth" });
  };

  return (
    <section id={id} className="relative py-7" aria-label={title}>
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-stretch gap-3">
            <div className="perf-v rounded-sm" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-0.5">
                {soon ? <Flame className="w-3.5 h-3.5" aria-hidden="true" /> : <Film className="w-3.5 h-3.5" aria-hidden="true" />}
                {soon ? "Pré-venda aberta" : "Programação da semana"}
              </div>
              <h2 className="f-display uppercase text-3xl md:text-4xl font-black leading-[0.95] text-foreground">{title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" aria-label="Anterior" disabled={page === 0} onClick={() => go(-1)} className="!rounded-lg bg-muted/60 disabled:opacity-40"><ChevronLeft className="w-5 h-5" /></Button>
            <Button size="icon" variant="ghost" aria-label="Próximo" disabled={page >= pages - 1} onClick={() => go(1)} className="!rounded-lg bg-muted/60 disabled:opacity-40"><ChevronRight className="w-5 h-5" /></Button>
          </div>
        </div>

        <div ref={ref} onScroll={update} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2">
          {movies.map((m) => (
            <div key={m.id} className="snap-start shrink-0 w-[40%] sm:w-[27%] md:w-[20%] lg:w-[16%]">
              <PosterCard movie={m} soon={soon} onSelectMovie={onSelectMovie} />
            </div>
          ))}
        </div>

        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-5" role="tablist" aria-label={`Páginas de ${title}`}>
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === page} aria-label={`Página ${i + 1}`} onClick={() => goTo(i)}
                className={`h-1.5 w-20 rounded-full transition-colors ${i === page ? "bg-foreground" : "bg-muted-foreground/40 hover:bg-muted-foreground/70"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============ EXPERIÊNCIA ============ */
/* Cada aba tem uma foto coerente: sala IMAX, poltronas/som, poltronas VIP */
const FEATURES = {
  imax: { icon: Tv2, label: "IMAX 4K Laser", title: "CineAstra IMAX® 4K Laser", description: "Telas gigantescas do chão ao teto e da parede à parede, com projeção laser dupla 4K para uma nitidez sem precedentes.", tags: ["Telas curvas de 24m", "Projeção laser 4K", "Assentos reclináveis premium"], image: wideImg(IMG.cinemaHall, 1600, 900) },
  atmos: { icon: Volume2, label: "Dolby Atmos®", title: "Som imersivo Dolby Atmos®", description: "64 canais de áudio independentes com alto-falantes no teto que fazem o som se mover ao seu redor com precisão tridimensional.", tags: ["Som 360° tridimensional", "Subwoofers duplos", "Isolamento acústico VIP"], image: wideImg(IMG.cinemaSeats, 1600, 900) },
  vip: { icon: Crown, label: "Gold Class VIP", title: "Salas VIP Gold Class Lounge", description: "Poltronas duplas de couro reclináveis eletricamente, com serviço de garçom acionado por botão direto no assento.", tags: ["Atendimento no assento", "Carta de vinhos e cocktails", "Poltronas chaise longue"], image: wideImg(IMG.vipSeats, 1600, 900) },
};

function ExperienceSection() {
  const [tab, setTab] = useState("imax");
  const item = FEATURES[tab];

  return (
    <section id="experiencia" className="grain edge-fade-top edge-fade-bottom relative py-28 bg-gradient-to-b from-background via-card/70 to-background overflow-hidden">
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
              <SmartImg src={item.image} alt={item.title} title={item.label} icon={item.icon} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
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

/* ============ GALERIA ============ */
function GallerySection() {
  return (
    <section id="galeria" className="relative py-24 bg-background">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <SectionTitle eyebrow="Conheça o espaço" title="Dentro do CineAstra" description="Salas, poltronas, projeção e bomboniere: cada detalhe pensado para a sua sessão." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {GALLERY.map((g) => (
            <figure key={g.id} style={{ "--n": "50%" }} className="ticket ticket-v group relative overflow-hidden border border-border bg-card aspect-[4/5]">
              <SmartImg src={g.image} alt={g.title} title={g.title} icon={g.icon} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 poster-scrim" aria-hidden="true" />
              <figcaption className="absolute inset-x-0 bottom-0 p-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1"><g.icon className="w-3.5 h-3.5" aria-hidden="true" />{g.title}</span>
                <p className="text-xs text-muted-foreground leading-snug">{g.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ COMBOS ============ */
function CombosSection({ onAddToCart }) {
  return (
    <section id="combos" className="relative py-24 bg-gradient-to-b from-background via-card/50 to-card/70">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <SectionTitle eyebrow="Snack bar e bomboniere" title="Combos e delícias" description="Pipocas aromatizadas, toppings gourmet e bebidas servidas na temperatura perfeita." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMBOS.map((c) => (
            <div key={c.id} className="ticket ticket-v group bg-card border border-border flex flex-col transition-transform duration-300 hover:-translate-y-1" style={{ "--n": "50%" }}>
              <div className="relative aspect-video overflow-hidden bg-muted">
                <SmartImg src={c.image} alt={c.title} title={c.title} icon={c.icon} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-background/45 to-transparent" aria-hidden="true" />
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
                {item.image && (
                  <div className="w-14 h-14 shrink-0 overflow-hidden rounded-md">
                    <SmartImg src={item.image} alt={item.title} title={item.title} icon={item.icon} />
                  </div>
                )}
                <div className="flex-1">
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
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [bookingMovie, setBookingMovie] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (item) => setCartItems((prev) => [...prev, item]);
  const handleRemoveFromCart = (index) => setCartItems((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="ca-root min-h-screen bg-background text-foreground transition-colors duration-300">
      <CinemaStyles />

      <HeroSection onOpenTrailer={setTrailerMovie} onSelectMovie={setBookingMovie} />

      <div className="bg-background pt-8 pb-12">
        <MovieCarousel id="em-cartaz" title="Em Cartaz" movies={NOW_PLAYING} onSelectMovie={setBookingMovie} />
        <MovieCarousel id="em-breve" title="Em Breve" movies={COMING_SOON} soon onSelectMovie={setBookingMovie} />
      </div>

      <SectionDivider />
      <ExperienceSection />
      <SectionDivider />
      <GallerySection />
      <SectionDivider />
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