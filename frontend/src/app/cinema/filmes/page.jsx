"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Clock3, Film, MapPin, Search, X, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MOVIES, CINEMAS } from "./movies";
import styles from "./filmes.module.css";
import "./cineastra-theme.css";

const SECTIONS = [
  { value: "em-cartaz", label: "Em cartaz" },
  { value: "pre-venda", label: "Pré-venda" },
  { value: "em-breve", label: "Em breve" },
];
const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const durationLabel = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`;

function PosterImage({ movie, className = "", eager = false }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`flex h-full w-full flex-col items-center justify-end gap-3 bg-gradient-to-br from-secondary via-card to-background p-5 text-center text-foreground ${className}`}>
      <Film aria-hidden="true" className="size-6 text-primary" />
      <span className="text-xs">Cartaz de {movie.title}</span>
    </div>
  ) : (
    <img src={movie.poster} alt={`Cartaz de ${movie.title}`} width={500} height={750}
      loading={eager ? "eager" : "lazy"} decoding="async" className={className} onError={() => setFailed(true)} />
  );
}

function AgeRating({ age }) {
  return <span className={`${styles.ageRating} ${styles[`age${age}`]}`} aria-label={age === "L" ? "Classificação livre" : `Classificação: ${age} anos`}>{age}</span>;
}

function Barcode({ seed }) {
  return <div className={styles.barcode} aria-hidden="true">{Array.from({ length: 34 }, (_, i) => (
    <span key={i} style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
  ))}</div>;
}

function MoviePoster({ movie, onSelect, index }) {
  return (
    <article className="group min-w-0">
      <button type="button" onClick={() => onSelect(movie)} aria-label={`Ver detalhes de ${movie.title}`}
        className={`${styles.posterTicket} block h-full w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
        <div className={styles.perforation} aria-hidden="true" />
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <PosterImage movie={movie} eager={index < 4} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
          <div className={styles.posterScrim} aria-hidden="true" />
          {movie.status !== "em-cartaz" && <span className={`${styles.titleFont} absolute left-3 top-3 rounded-md border border-primary/30 bg-secondary px-2.5 py-1.5 text-[11px] font-semibold uppercase text-secondary-foreground shadow-sm`}>
            {movie.status === "pre-venda" ? "Pré-venda" : "Em breve"}
          </span>}
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-background/90 via-background/40 to-transparent p-4 pt-16 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none" aria-hidden="true">
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground"><Ticket className="size-4" />Ver detalhes</span>
          </div>
        </div>
        <div className={styles.perforation} aria-hidden="true" />
        <div className="px-3 pt-4 sm:px-4">
          <p className="truncate text-[11px] font-semibold text-primary">{movie.genres.join(" · ")}</p>
          <h2 className={`${styles.titleFont} mt-1 line-clamp-2 min-h-[3rem] text-lg font-semibold uppercase leading-6 text-card-foreground transition-colors group-hover:text-primary sm:text-xl`}>{movie.title}</h2>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock3 className="size-3" aria-hidden="true" />{durationLabel(movie.duration)}</p>
        </div>
        <div className={`${styles.tear} mx-3 mt-4 sm:mx-4`} aria-hidden="true" />
        <div className="px-3 pb-4 pt-3 sm:px-4">
          <p className="mb-2 text-[11px] text-muted-foreground">{movie.sessions.length ? "Próximas sessões" : "Sessões em breve"}</p>
          <div className="flex min-h-7 flex-wrap gap-1.5">
            {movie.sessions.slice(0, 3).map((time) => <span key={time} className="rounded-sm border border-secondary/40 bg-secondary/20 px-2 py-1 text-[10px] font-bold text-foreground">{time}</span>)}
            {!movie.sessions.length && <span className="text-[11px] text-foreground">Horários a confirmar</span>}
          </div>
          <div className="mt-4 flex items-end justify-between gap-2"><Barcode seed={movie.title.length} /><AgeRating age={movie.age} /></div>
        </div>
      </button>
    </article>
  );
}

export default function CinemaMoviesPage() {
  const [section, setSection] = useState("em-cartaz");
  const [cinema, setCinema] = useState("todos");
  const [genre, setGenre] = useState("Todos");
  const [query, setQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const suggestionsId = useId();

  const availableMovies = useMemo(() => MOVIES.filter((movie) => movie.status === section &&
    (cinema === "todos" || movie.cinemas.includes(cinema))), [section, cinema]);
  const genres = useMemo(() => ["Todos", ...new Set(availableMovies.flatMap((movie) => movie.genres))], [availableMovies]);
  const visibleMovies = useMemo(() => availableMovies.filter((movie) =>
    (genre === "Todos" || movie.genres.includes(genre)) && normalize(movie.title).includes(normalize(query))), [availableMovies, genre, query]);
  const suggestions = availableMovies.filter((movie) => genre === "Todos" || movie.genres.includes(genre));
  const activeLabel = SECTIONS.find((item) => item.value === section)?.label;

  function changeSection(value) {
    setSection(value);
    setGenre("Todos");
    setQuery("");
  }

  function changeCinema(value) {
    if (!value) return;
    setCinema(value);
    setGenre("Todos");
  }

  function clearFilters() {
    setGenre("Todos");
    setQuery("");
  }

  return (
    <main className={`${styles.root} min-h-screen bg-background text-foreground`}>
      <div className={`${styles.content} mx-auto max-w-[1240px] px-5 pb-16 pt-10 sm:px-8 lg:pt-14`}>
        <div className="mb-8 flex items-stretch gap-4">
          <div className={styles.verticalPerf} aria-hidden="true" />
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary"><Film className="size-3.5" aria-hidden="true" /> Cinema</p>
            <h1 className={`${styles.display} text-5xl font-black uppercase leading-[0.95] sm:text-7xl`}>Filmes no cinema</h1>
          </div>
        </div>

        <Tabs value={section} onValueChange={changeSection} className="flex w-full flex-col gap-0">
          <div className="flex flex-col justify-between gap-5 pb-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
              <Select items={CINEMAS} value={cinema} onValueChange={changeCinema}>
                <SelectTrigger aria-label="Selecionar cinema" className="h-10 w-[230px] rounded-full border-border bg-card px-4 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{CINEMAS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <TabsList className="grid h-11 w-full grid-cols-3 rounded-none border-b border-border/60 bg-transparent p-0 sm:w-auto sm:min-w-[390px]">
              {SECTIONS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}
                  className={`${styles.tab} h-11 rounded-none border-0 bg-transparent px-4 text-sm font-bold text-muted-foreground shadow-none hover:text-foreground data-[active]:bg-transparent data-[active]:text-primary data-[active]:shadow-none`}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className={styles.filmStrip} aria-hidden="true" />

          {SECTIONS.map((item) => (
            <TabsContent key={item.value} value={item.value} className="mt-0 outline-none">
              <div className="flex flex-col justify-between gap-6 pb-6 pt-7 lg:flex-row lg:items-start">
                <div className="flex max-w-full flex-wrap gap-x-1 gap-y-2 lg:max-w-[65%]" role="group" aria-label="Filtrar por gênero">
                  {genres.map((name) => (
                    <Button key={name} type="button" variant="ghost" size="sm" aria-pressed={genre === name} onClick={() => setGenre(name)}
                      className={`h-8 rounded-full border px-3.5 text-xs font-semibold shadow-none ${genre === name ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "border-transparent text-muted-foreground hover:border-border hover:bg-transparent hover:text-foreground"}`}>
                      {name}
                    </Button>
                  ))}
                </div>
                <div className="relative w-full lg:w-[290px] lg:shrink-0">
                  <label htmlFor={`${suggestionsId}-${item.value}`} className="sr-only">Pesquisar filmes em {item.label.toLowerCase()}</label>
                  <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                  <Input id={`${suggestionsId}-${item.value}`} type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                    list={`${suggestionsId}-options-${item.value}`} autoComplete="off" placeholder="Qual filme você procura?"
                    className="h-10 rounded-full border-border bg-background/50 pl-9 pr-3 text-xs shadow-none" />
                  <datalist id={`${suggestionsId}-options-${item.value}`}>
                    {suggestions.map((movie) => <option key={movie.id} value={movie.title} />)}
                  </datalist>
                </div>
              </div>

              <div className="mb-6 flex min-h-6 flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground" role="status" aria-live="polite">
                  <span className="font-semibold text-foreground">{visibleMovies.length} {visibleMovies.length === 1 ? "filme" : "filmes"}</span> · {activeLabel}
                  {cinema !== "todos" ? ` · ${CINEMAS.find((item) => item.value === cinema)?.label}` : ""}
                </p>
                {(genre !== "Todos" || query) && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 gap-1.5 px-0 text-[11px] text-muted-foreground hover:bg-transparent"><X className="size-3" />Limpar filtros</Button>}
              </div>

              {visibleMovies.length ? (
                <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-11">
                  {visibleMovies.map((movie, index) => <MoviePoster key={movie.id} movie={movie} index={index} onSelect={setSelectedMovie} />)}
                </div>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center border-y border-dashed border-border px-6 text-center">
                  <Film className="mb-4 size-7 text-primary" aria-hidden="true" />
                  <h2 className={`${styles.display} text-3xl font-bold`}>Nenhum filme por aqui</h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Tente outro título ou gênero para encontrar sua próxima sessão.</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-5 rounded-full">Ver todos nesta aba</Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className={`${styles.sectionDivider} mt-12 flex flex-wrap items-center justify-between gap-3 pt-5 text-[10px] uppercase tracking-widest text-muted-foreground`}>
          <span>CineAstra · Cinema</span>
          <span>Catálogo demonstrativo</span>
        </div>
      </div>

      <Dialog open={Boolean(selectedMovie)} onOpenChange={(open) => { if (!open) setSelectedMovie(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg bg-card sm:max-w-[700px]">
          {selectedMovie && (
            <div className="grid gap-6 sm:grid-cols-[170px_1fr]">
              <div className="mx-auto aspect-[2/3] w-36 overflow-hidden rounded-sm sm:w-full"><PosterImage key={selectedMovie.id} movie={selectedMovie} className="h-full w-full object-cover" eager /></div>
              <div>
                <DialogHeader className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{SECTIONS.find((item) => item.value === selectedMovie.status)?.label}</p>
                  <DialogTitle className={`${styles.display} pr-4 text-4xl font-bold leading-tight`}>{selectedMovie.title}</DialogTitle>
                  <DialogDescription className="mt-3 text-sm leading-relaxed">{selectedMovie.synopsis}</DialogDescription>
                </DialogHeader>
                <div className="my-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <AgeRating age={selectedMovie.age} /><span>{durationLabel(selectedMovie.duration)}</span><span>{selectedMovie.genres.join(" · ")}</span>
                </div>
                <div className={`${styles.tear} pt-4`}>
                  <p className="flex items-center gap-2 text-sm font-semibold"><Ticket className="size-4 text-primary" aria-hidden="true" />{selectedMovie.status === "em-breve" ? "Programação em breve" : "Sessões de demonstração"}</p>
                  {selectedMovie.sessions.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{selectedMovie.sessions.map((time) => <span key={time} className="border border-border bg-muted/40 px-3 py-2 text-xs font-bold">{time}</span>)}</div> : <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Os horários aparecerão aqui quando a programação estiver disponível.</p>}
                  <p className="mt-3 text-[11px] text-muted-foreground">{selectedMovie.formats.join(" · ")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
