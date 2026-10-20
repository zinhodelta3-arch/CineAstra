"use client";
/*
  CineAstra Stream — Página de Perfil
  Tailwind v4 + shadcn (tokens do tema, claro/escuro)

  Componentes shadcn usados (rode uma vez):
    npx shadcn@latest add button dialog tabs input label

  Dica: <Art /> abaixo é uma versão simplificada para esta página ficar
  independente. No projeto, apague-a e importe o <Art /> / <FilmArt /> da home.
*/
import React, { useState, useEffect, useRef } from "react";
import {
  Film, Star, Play, Plus, Check, Camera, Upload, Trash2, Crown, Zap,
  Sparkles, Ticket, Users, ChevronLeft, ChevronRight, Clock3, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const ACCENT = "text-secondary dark:text-primary";
const TRAILER = "https://www.youtube.com/embed/dQw4w9WgXcQ";
const STORAGE_KEY = "cineastra:perfil";

/* ============ DADOS (mesmos ids da home) ============ */
const FILMS = [
  { id: "m1", title: "O Último Fotograma", genre: "Suspense", duration: "2h 08min", age: "14", match: 98, bg: ["#ece1dc", "#7c1029"] },
  { id: "m2", title: "Constelação Kira", genre: "Ficção Científica", duration: "2h 21min", age: "12", match: 96, bg: ["#3b1f5c", "#150a24"] },
  { id: "m3", title: "Maré Vermelha", genre: "Ação", duration: "2h 01min", age: "16", match: 92, bg: ["#971d00", "#2a0d05"] },
  { id: "m4", title: "Baile das Sombras", genre: "Terror", duration: "1h 54min", age: "16", match: 94, bg: ["#7c1029", "#1b0710"] },
  { id: "m5", title: "Sete Invernos", genre: "Drama", duration: "1h 58min", age: "12", match: 91, bg: ["#cfe3ee", "#2d4a63"] },
  { id: "m6", title: "O Segredo de Gaia", genre: "Animação", duration: "1h 38min", age: "Livre", match: 97, bg: ["#1f3d2b", "#0b1a11"] },
  { id: "m7", title: "Noite de Estreia", genre: "Comédia", duration: "1h 46min", age: "12", match: 88, bg: ["#971d00", "#2a0d05"] },
  { id: "m8", title: "Projeção Final", genre: "Suspense", duration: "2h 04min", age: "14", match: 90, bg: ["#353323", "#14130b"] },
  { id: "m9", title: "Fogo Cruzado", genre: "Ação", duration: "2h 09min", age: "16", match: 87, bg: ["#14130b", "#353323"] },
  { id: "m10", title: "Lua de Celuloide", genre: "Drama", duration: "2h 12min", age: "12", match: 93, bg: ["#1b2a49", "#0b1222"] },
  { id: "m11", title: "Último Trem para Aurora", genre: "Aventura", duration: "1h 59min", age: "12", match: 89, bg: ["#1f3d2b", "#0b1a11"] },
  { id: "m12", title: "A Casa dos Ecos", genre: "Terror", duration: "1h 47min", age: "16", match: 86, bg: ["#1b2a49", "#0b1222"] },
  { id: "m13", title: "Poeira de Ouro", genre: "Aventura", duration: "2h 15min", age: "14", match: 90, bg: ["#c8742c", "#4a1f08"] },
  { id: "m14", title: "Cidade de Vidro", genre: "Ficção Científica", duration: "2h 03min", age: "14", match: 91, bg: ["#0e3b43", "#061a1e"] },
];
const byId = (ids) => ids.map((id) => FILMS.find((f) => f.id === id)).filter(Boolean);

const CONTINUE = byId(["m3", "m8", "m5", "m14"]);
const PROGRESS = { m3: 40, m8: 75, m5: 20, m14: 90 };
const RECOMMENDED = byId(["m2", "m4", "m11", "m13", "m9", "m12"]);
const INITIAL_LIST = ["m1", "m6", "m10"];
const INITIAL_TRAILERS = [
  { id: "m1", when: "Hoje" },
  { id: "m2", when: "Há 2 dias" },
  { id: "m7", when: "Há 5 dias" },
  { id: "m9", when: "Semana passada" },
];

const AVATARS = [
  { id: "film", icon: Film, from: "#971d00", to: "#2a0d05" },
  { id: "star", icon: Star, from: "#fad241", to: "#971d00" },
  { id: "crown", icon: Crown, from: "#7c1029", to: "#1b0710" },
  { id: "zap", icon: Zap, from: "#0e3b43", to: "#061a1e" },
  { id: "sparkles", icon: Sparkles, from: "#3b1f5c", to: "#150a24" },
  { id: "ticket", icon: Ticket, from: "#c8742c", to: "#4a1f08" },
  { id: "users", icon: Users, from: "#1f3d2b", to: "#0b1a11" },
  { id: "play", icon: Play, from: "#1b2a49", to: "#0b1222" },
];

/* ============ ESTILOS (mesmos da home) ============ */
const ProfileStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');
    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .no-scrollbar { scrollbar-width: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .ticket {
      --n: 50%;
      -webkit-mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
      mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
    }
    .tear { border-top: 2px dashed var(--border); }
    .tear-v { border-left: 2px dashed var(--border); }
  `}</style>
);

/* ============ ARTE (versão simplificada — troque pelo <Art /> da home) ============ */
function Art({ movie, className = "" }) {
  const [a, b] = movie.bg;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(160deg, ${a}, ${b})` }} role="img" aria-label={`Arte de ${movie.title}`}>
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
      <span className="f-display absolute inset-x-3 bottom-2 text-2xl md:text-3xl font-black uppercase leading-[0.9] text-white">{movie.title}</span>
    </div>
  );
}

/* ============ AVATAR ============ */
function Avatar({ avatar, name, className = "size-28" }) {
  if (avatar?.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar.src} alt={`Foto de ${name}`} className={`${className} rounded-full object-cover border-2 border-primary`} />;
  }
  const preset = AVATARS.find((a) => a.id === avatar?.id) ?? AVATARS[0];
  const Icon = preset.icon;
  return (
    <div className={`${className} rounded-full border-2 border-primary flex items-center justify-center text-white shrink-0`} style={{ background: `linear-gradient(145deg, ${preset.from}, ${preset.to})` }} role="img" aria-label={`Avatar de ${name}`}>
      <Icon className="size-1/2" aria-hidden="true" />
    </div>
  );
}

function Barcode({ seed = 7 }) {
  return (
    <div className="flex items-end gap-[2px] h-10" aria-hidden="true">
      {Array.from({ length: 34 }).map((_, i) => (
        <span key={i} className="bg-foreground/70" style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
      ))}
    </div>
  );
}

/* ============ FILEIRA + CARD ============ */
function Row({ title, hint, children }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  const arrow = "absolute inset-y-0 w-10 z-30 hidden sm:flex items-center justify-center opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity text-foreground/40 hover:text-foreground/90 outline-hidden";

  return (
    <section className="group/row relative py-3 md:py-4">
      <h2 className="f-display text-3xl md:text-4xl font-black text-foreground flex items-center gap-2">
        <Ticket className={`size-5 ${ACCENT}`} aria-hidden="true" /> {title}
      </h2>
      {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
      <div className="relative mt-3">
        <button type="button" aria-label="Rolar para a esquerda" onClick={() => scroll(-1)} className={`${arrow} left-0 bg-linear-to-r from-background/50 to-transparent`}><ChevronLeft className="size-6" strokeWidth={1.5} /></button>
        <div ref={ref} className="no-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth snap-x py-3">{children}</div>
        <button type="button" aria-label="Rolar para a direita" onClick={() => scroll(1)} className={`${arrow} right-0 bg-linear-to-l from-background/50 to-transparent`}><ChevronRight className="size-6" strokeWidth={1.5} /></button>
      </div>
    </section>
  );
}

function EmptyRow({ children }) {
  return <p className="text-sm text-muted-foreground border border-dashed border-border rounded-md px-5 py-8 w-full">{children}</p>;
}

function Card({ movie, onOpen, progress, meta, actions, label }) {
  return (
    <div
      role="button" tabIndex={0} aria-label={label ?? movie.title}
      onClick={() => onOpen(movie)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(movie))}
      className="group snap-start shrink-0 relative w-[250px] md:w-[300px] aspect-video rounded-md overflow-hidden bg-card border border-border cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:z-20 hover:border-primary hover:shadow-2xl hover:shadow-black/60 focus-visible:ring-2 focus-visible:ring-primary outline-hidden"
    >
      <Art movie={movie} className="absolute inset-0 size-full" />
      <span className="absolute top-2 left-2 f-display text-[13px] font-black tracking-[0.18em] text-primary bg-black/60 px-1.5 rounded-xs leading-tight">CINEASTRA</span>
      {meta && <span className="absolute top-2 right-2 text-[11px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">{meta}</span>}

      <div className="absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-background via-background/70 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 mb-1.5">{actions}</div>
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-2 flex-wrap">
          <span className={ACCENT}>{movie.match}% relevante</span>
          <span className="px-1 border border-muted-foreground/60 rounded-xs">{movie.age}</span>
          <span>{movie.duration}</span>
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

const RoundBtn = ({ label, onClick, solid, children }) => (
  <button
    type="button" aria-label={label}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`size-9 rounded-full flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${solid ? "bg-primary text-primary-foreground hover:opacity-90" : "border-2 border-foreground/60 text-foreground hover:border-primary"}`}
  >
    {children}
  </button>
);

/* ============ EDITAR PERFIL ============ */
function EditForm({ profile, onSave, onCancel }) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
    if (file.size > 2 * 1024 * 1024) return setError("A imagem precisa ter até 2 MB.");
    const reader = new FileReader();
    reader.onload = () => { setError(""); setAvatar({ type: "image", src: reader.result }); };
    reader.readAsDataURL(file);
  };

  const cleanName = name.trim();

  return (
    <>
      <DialogHeader>
        <DialogTitle className="f-display text-4xl font-black leading-none">Editar perfil</DialogTitle>
        <DialogDescription>Troque sua foto ou escolha um avatar.</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-5">
        <Avatar avatar={avatar} name={cleanName || "perfil"} className="size-24" />
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
          <Button type="button" size="sm" className="rounded-full" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" /> Enviar foto
          </Button>
          {avatar.type === "image" && (
            <Button type="button" size="sm" variant="ghost" className="rounded-full text-muted-foreground" onClick={() => setAvatar({ type: "preset", id: "film" })}>
              <Trash2 className="size-4" aria-hidden="true" /> Remover foto
            </Button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive -mt-2">{error}</p>}

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Ou escolha um avatar</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {AVATARS.map((a) => {
            const selected = avatar.type === "preset" && avatar.id === a.id;
            return (
              <button
                key={a.id} type="button" aria-label={`Avatar ${a.id}`} aria-pressed={selected}
                onClick={() => setAvatar({ type: "preset", id: a.id })}
                className={`relative rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-transform hover:scale-105 ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
              >
                <Avatar avatar={{ type: "preset", id: a.id }} name="" className="size-full aspect-square border-0" />
                {selected && <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="size-3" /></span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-name">Nome do perfil</Label>
        <Input id="profile-name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className="rounded-full px-5" />
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>Cancelar</Button>
        <Button type="button" className="rounded-full" disabled={!cleanName} onClick={() => onSave({ name: cleanName, avatar })}>Salvar alterações</Button>
      </DialogFooter>
    </>
  );
}

/* ============ PÁGINA ============ */
export default function PerfilPage() {
  const [profile, setProfile] = useState({ name: "Cinéfilo", avatar: { type: "preset", id: "film" } });
  const [editing, setEditing] = useState(false);
  const [list, setList] = useState(INITIAL_LIST);
  const [trailers, setTrailers] = useState(INITIAL_TRAILERS);
  const [trailerOpen, setTrailerOpen] = useState(null);
  const [tab, setTab] = useState("all");

  /* carrega o perfil salvo */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.name && saved?.avatar) setProfile(saved);
    } catch {}
  }, []);

  const saveProfile = (next) => {
    setProfile(next);
    setEditing(false);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const toggleList = (m) => setList((p) => (p.includes(m.id) ? p.filter((id) => id !== m.id) : [...p, m.id]));

  const openTrailer = (m) => {
    setTrailerOpen(m);
    setTrailers((p) => [{ id: m.id, when: "Hoje" }, ...p.filter((t) => t.id !== m.id)]);
  };

  const myListFilms = byId(list);
  const watchedTrailers = trailers.map((t) => ({ ...FILMS.find((f) => f.id === t.id), when: t.when })).filter((f) => f.id);
  const show = (key) => tab === "all" || tab === key;

  const playBtn = (m) => <RoundBtn label={`Assistir ${m.title}`} solid onClick={() => openTrailer(m)}><Play className="size-4 fill-current" /></RoundBtn>;
  const listBtn = (m) => (
    <RoundBtn label={list.includes(m.id) ? "Remover da lista" : "Adicionar à lista"} onClick={() => toggleList(m)}>
      {list.includes(m.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
    </RoundBtn>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <ProfileStyles />

      <main className="max-w-[1800px] mx-auto px-5 md:px-12 pt-28 pb-24">
        {/* CABEÇALHO — ingresso simples */}
        <section aria-label="Meu perfil" className="ticket grid md:grid-cols-[1fr_240px] bg-card border border-border rounded-xl shadow-2xl">
          <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative w-fit">
              <Avatar avatar={profile.avatar} name={profile.name} className="size-28 md:size-32" />
              <button
                type="button" onClick={() => setEditing(true)} aria-label="Editar foto do perfil"
                className="absolute -bottom-1 -right-1 size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md outline-hidden hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Camera className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="min-w-0">
              <p className={`text-sm font-semibold ${ACCENT}`}>Plano Premium</p>
              <h1 className="f-display text-5xl md:text-6xl font-black text-card-foreground leading-[0.95] truncate">{profile.name}</h1>
              <dl className="flex gap-6 mt-4 text-sm">
                <div><dt className="text-muted-foreground text-xs">Na minha lista</dt><dd className="f-display text-3xl font-black text-card-foreground">{list.length}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Trailers vistos</dt><dd className="f-display text-3xl font-black text-card-foreground">{trailers.length}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Horas assistidas</dt><dd className="f-display text-3xl font-black text-card-foreground">128</dd></div>
              </dl>
              <Button variant="outline" size="sm" className="rounded-full mt-5" onClick={() => setEditing(true)}>Editar perfil</Button>
            </div>
          </div>

          <div className="tear tear-v border-t-0 max-md:border-l-0 max-md:border-t-2 bg-secondary/15 p-6 flex md:flex-col justify-between items-end md:items-stretch gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Membro desde</span>
              <span className={`f-display text-4xl font-black ${ACCENT}`}>2024</span>
              <span className="text-xs text-muted-foreground block mt-1">4K HDR · 3 telas</span>
            </div>
            <Barcode seed={profile.name.length + 3} />
          </div>
        </section>

        {/* FILTRO DAS FILEIRAS */}
        <Tabs value={tab} onValueChange={setTab} className="mt-10">
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              ["all", "Tudo"], ["continue", "Continuar assistindo"], ["list", "Minha lista"],
              ["rec", "Recomendados"], ["trailers", "Trailers assistidos"],
            ].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="rounded-full border border-border px-4 py-1.5 text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* FILEIRAS */}
        <div className="mt-4">
          {show("continue") && (
            <Row title="Continuar assistindo">
              {CONTINUE.map((m) => (
                <Card key={m.id} movie={m} progress={PROGRESS[m.id]} meta={`${PROGRESS[m.id]}%`} onOpen={openTrailer} actions={<>{playBtn(m)}{listBtn(m)}</>} />
              ))}
            </Row>
          )}

          {show("list") && (
            <Row title="Minha lista">
              {myListFilms.length === 0 ? (
                <EmptyRow>Sua lista está vazia. Adicione filmes nas recomendações para assistir depois.</EmptyRow>
              ) : (
                myListFilms.map((m) => (
                  <Card key={m.id} movie={m} onOpen={openTrailer} actions={<>{playBtn(m)}<RoundBtn label={`Remover ${m.title} da lista`} onClick={() => toggleList(m)}><Trash2 className="size-4" /></RoundBtn></>} />
                ))
              )}
            </Row>
          )}

          {show("rec") && (
            <Row title="Recomendados para você" hint="Com base nos filmes que você assistiu e salvou.">
              {RECOMMENDED.map((m) => (
                <Card key={m.id} movie={m} onOpen={openTrailer} actions={<>{playBtn(m)}{listBtn(m)}</>} />
              ))}
            </Row>
          )}

          {show("trailers") && (
            <Row title="Trailers assistidos">
              {watchedTrailers.map((m) => (
                <Card key={m.id} movie={m} meta={m.when} label={`Rever trailer de ${m.title}`} onOpen={openTrailer} actions={<>{playBtn(m)}{listBtn(m)}</>} />
              ))}
            </Row>
          )}
        </div>
      </main>

      {/* EDITAR PERFIL */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="ticket max-w-xl gap-5 bg-card border-border sm:rounded-xl">
          {editing && <EditForm profile={profile} onSave={saveProfile} onCancel={() => setEditing(false)} />}
        </DialogContent>
      </Dialog>

      {/* TRAILER */}
      <Dialog open={!!trailerOpen} onOpenChange={(o) => !o && setTrailerOpen(null)}>
        <DialogContent className="max-w-5xl bg-card border-border p-3 sm:rounded-lg">
          <DialogHeader className="px-2 pt-2">
            <DialogTitle className="f-display text-3xl font-black">{trailerOpen?.title}</DialogTitle>
            <DialogDescription>Trailer</DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
            {trailerOpen && (
              <iframe src={`${TRAILER}?autoplay=1`} title={`Trailer de ${trailerOpen.title}`} className="size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}