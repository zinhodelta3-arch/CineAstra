"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, ArrowRight, Search, X, LayoutGrid, Play, Film, SlidersHorizontal, Clock3 } from "lucide-react";
import { StreamHeader } from "@/components/stream-header";
import { useVideoPlayer } from "@/components/cineastra-player/VideoProvider";
import { FILMS } from "@/lib/stream-catalog";
import { GENRES, belongsToGenre, normalize, searchFilms } from "@/lib/stream-search";
import { Art } from "./film-art";
import "./stream-discovery.css";

const POPULAR_IDS = ["m1", "m2", "m6", "m3", "m10", "m14"];
const POPULAR = POPULAR_IDS.map((id) => FILMS.find((film) => film.id === id)).filter(Boolean);
const QUICK_TERMS = ["Mistério", "Espaço", "Família", "Cinema"];

export function Barcode({ seed = 7 }) {
  return <div className="sd-barcode" aria-hidden="true">{Array.from({ length: 29 }, (_, i) => <i key={i} style={{ width: (i * seed) % 3 + 1, height: `${60 + (i * 13 + seed) % 40}%` }} />)}</div>;
}

function FilmCard({ film, onSelect }) {
  return <button type="button" className="sd-film" onClick={() => onSelect(film)} aria-label={`Ver detalhes de ${film.title}`}>
    <div className="sd-poster"><Art movie={film} variant="poster" className="sd-art" /><span className="sd-film-label">{film.soon ? "EM BREVE" : film.genre}</span><span className="sd-play" aria-hidden="true"><ArrowUpRight size={22} /></span></div>
    <div className="sd-film-caption"><h3>{film.title}</h3><span>{film.year}<i />{film.soon ? "Em breve" : film.duration}</span></div>
  </button>;
}

function FilmDialog({ film, onClose, onPlay }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; if (dialog.open) dialog.close(); };
  }, []);
  return <dialog ref={ref} className="sd-dialog" aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
    <div className="sd-dialog-inner"><div className="sd-dialog-art"><Art movie={film} variant="poster" className="sd-art" /><Barcode /></div>
      <div className="sd-dialog-copy"><button type="button" autoFocus className="sd-close sd-icon" aria-label="Fechar detalhes" onClick={onClose}><X size={20} /></button>
        <p className="sd-eyebrow">CINEASTRA STREAM / {film.soon ? "EM BREVE" : film.genre}</p><h2 id={titleId} className="sd-display">{film.title}</h2>
        <div className="sd-meta"><span>{film.year}</span><span><Clock3 size={14} />{film.duration}</span><span className="sd-age">{film.age === "Livre" ? "Livre" : `${film.age} anos`}</span></div>
        <p className="sd-synopsis">{film.synopsis}</p><p className="sd-cast">Elenco: {film.cast}</p>
        {film.soon ? <p className="sd-availability">Este título ainda não está disponível para assistir.</p> : <button className="sd-primary" type="button" onClick={() => { onClose(); onPlay(film, "movie"); }}><Play size={17} fill="currentColor" />Assistir filme</button>}
        <div className="sd-dialog-footer"><span>UMA HISTÓRIA. SUA PRÓXIMA SESSÃO.</span><span>CA / {film.id.replace("m", "").padStart(3, "0")}</span></div>
      </div>
    </div>
  </dialog>;
}

export function DiscoveryLoading() {
  return <div className="sd-page"><StreamHeader /><main className="sd-main" aria-busy="true"><p className="sd-eyebrow">CINEASTRA STREAM</p><h1 className="sd-display">Preparando sua sessão…</h1></main></div>;
}

export function StreamDiscovery({ mode = "search" }) {
  const isSearch = mode === "search";
  const params = useSearchParams();
  const router = useRouter();
  const initialQuery = params.get("q") ?? "";
  const selectedSlug = params.get("genero") ?? "";
  const selectedGenre = GENRES.find((genre) => genre.slug === selectedSlug);
  const invalidGenre = !isSearch && selectedSlug && !selectedGenre;
  const [query, setQuery] = useState(initialQuery);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [details, setDetails] = useState(null);
  const [sort, setSort] = useState("relevance");
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const listId = useId();
  const { openVideo } = useVideoPlayer();

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);
  useEffect(() => {
    if (isSearch) inputRef.current?.focus({ preventScroll: true });
  }, [isSearch]);
  useEffect(() => {
    const outside = (event) => { if (!searchRef.current?.contains(event.target)) setSuggestionsOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => { setActiveIndex(-1); }, [query]);

  const searching = Boolean(normalize(query));
  const allMatches = searchFilms(query);
  const genreSuggestions = searching ? GENRES.filter((genre) => normalize(genre.name).includes(normalize(query))).slice(0, 2) : [];
  const suggestions = [...allMatches.slice(0, 4).map((film) => ({ key: film.id, film })), ...genreSuggestions.map((genre) => ({ key: genre.slug, genre }))];
  const showSuggestions = isSearch && searching && suggestionsOpen;
  let results = isSearch ? (searching ? allMatches : POPULAR) : selectedGenre ? FILMS.filter((film) => belongsToGenre(film, selectedGenre.name)) : [];
  if (sort === "az") results = [...results].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  if (sort === "recent") results = [...results].sort((a, b) => b.year - a.year);

  function chooseSuggestion(item) {
    setSuggestionsOpen(false);
    if (item.genre) router.push(`/streamming/generos?genero=${item.genre.slug}`);
    else { setDetails(item.film); }
  }
  function searchTerm(term) {
    setQuery(term); setSuggestionsOpen(true); inputRef.current?.focus();
  }
  function submitSearch(event) {
    event.preventDefault();
    if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) { chooseSuggestion(suggestions[activeIndex]); return; }
    setSuggestionsOpen(false);
    const next = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.replace(`/streamming/busca${next}`, { scroll: false });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function searchKeys(event) {
    if (event.key === "Escape") { setSuggestionsOpen(false); setActiveIndex(-1); }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && searching && suggestions.length) {
      event.preventDefault(); setSuggestionsOpen(true);
      setActiveIndex((current) => event.key === "ArrowDown" ? (current + 1) % suggestions.length : (current <= 0 ? suggestions.length - 1 : current - 1));
    }
  }

  return <div className="sd-page"><StreamHeader /><main className="sd-main">
    <Link href="/streamming" className="sd-back"><ArrowLeft size={15} />Voltar ao streaming</Link>
    <header className="sd-intro"><div><p className="sd-eyebrow"><span /> CINEASTRA STREAM / EXPLORE O CATÁLOGO</p>
      <h1 className="sd-display">{isSearch ? <>Encontre seu<br /><em>próximo filme.</em></> : <>Explore por<br /><em>gênero.</em></>}</h1>
      <p className="sd-lead">{isSearch ? "Um título, um ator ou aquela história que não sai da cabeça." : "Escolha o clima. A próxima história fica por nossa conta."}</p>
    </div><aside className="sd-stub" aria-label={`${FILMS.length} títulos no catálogo`}><span className="sd-stub-label">CINEASTRA / STREAM</span><strong className="sd-display">A PRÓXIMA<br />SESSÃO É SUA.</strong><div><Barcode /><span>{String(FILMS.length).padStart(3, "0")} TÍTULOS<br />CA / STREAM</span></div></aside></header>

    <nav className="sd-modes" aria-label="Formas de explorar"><Link className={isSearch ? "is-active" : ""} href="/streamming/busca" aria-current={isSearch ? "page" : undefined}><Search size={17} />Buscar por palavras</Link><Link className={!isSearch ? "is-active" : ""} href="/streamming/generos" aria-current={!isSearch ? "page" : undefined}><LayoutGrid size={17} />Explorar gêneros</Link><span className="sd-mode-note">ESCOLHA SUA PRÓXIMA SESSÃO <ArrowUpRight size={14} /></span></nav>

    {isSearch ? <section className="sd-search-area" aria-label="Pesquisa de filmes">
      <div ref={searchRef} className="sd-search-wrap" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSuggestionsOpen(false); }}>
        <form onSubmit={submitSearch} className="sd-search-form"><Search size={24} aria-hidden="true" /><label htmlFor="sd-search-input" className="sd-sr-only">Busque por título, gênero, elenco ou palavra-chave</label>
          <input ref={inputRef} id="sd-search-input" role="combobox" autoComplete="off" aria-autocomplete="list" aria-controls={showSuggestions && suggestions.length ? listId : undefined} aria-expanded={showSuggestions} aria-activedescendant={showSuggestions && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined} placeholder="Qual história você procura?" value={query} onChange={(event) => { setQuery(event.target.value); setSuggestionsOpen(true); }} onFocus={() => setSuggestionsOpen(true)} onKeyDown={searchKeys} maxLength={120} />
          {query && <button type="button" className="sd-icon" aria-label="Limpar pesquisa" onClick={() => searchTerm("")}><X size={19} /></button>}
          <button className="sd-submit" type="submit" aria-label="Pesquisar"><span>Buscar</span><ArrowRight size={20} /></button>
        </form>
        {showSuggestions && <div className="sd-suggestions"><div className="sd-suggestion-label">SUGESTÕES PARA SUA BUSCA <span>{suggestions.length ? "↵ PARA ESCOLHER" : ""}</span></div>
          {suggestions.length ? <ul id={listId} role="listbox" aria-label="Sugestões de filmes e gêneros">{suggestions.map((item, index) => <li key={item.key} id={`${listId}-${index}`} role="option" aria-selected={activeIndex === index} onPointerDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(item)} onMouseEnter={() => setActiveIndex(index)} className={activeIndex === index ? "is-active" : ""}>
            {item.film ? <><div className="sd-suggestion-art"><Art movie={item.film} showTitle={false} className="sd-art" /></div><div><strong>{item.film.title}</strong><span>{item.film.genre} · {item.film.year}{item.film.soon ? " · Em breve" : ""}</span></div></> : <><div className="sd-suggestion-art sd-suggestion-icon"><LayoutGrid size={20} /></div><div><strong>{item.genre.name}</strong><span>Explorar este gênero</span></div></>}<ArrowUpRight size={16} />
          </li>)}</ul> : <p className="sd-no-suggestions">Nenhuma sugestão. Experimente outro título ou palavra-chave.</p>}
        </div>}
      </div>
      <div className="sd-quick"><span>COMECE POR UM CLIMA</span>{QUICK_TERMS.map((term) => <button type="button" key={term} onClick={() => searchTerm(term)}>{term}<ArrowUpRight size={12} /></button>)}</div>
    </section> : <section className="sd-categories" aria-labelledby="sd-categories-heading"><div className="sd-section-heading"><div><p className="sd-eyebrow">O CATÁLOGO, DO SEU JEITO</p><h2 id="sd-categories-heading">Filmes por gênero</h2></div><span className="sd-total">12 CATEGORIAS</span></div>
      <div className="sd-genre-grid">{GENRES.map((genre, index) => {
        const count = FILMS.filter((film) => belongsToGenre(film, genre.name)).length;
        const film = FILMS.find((item) => item.id === genre.film);
        return <Link key={genre.slug} href={`/streamming/generos?genero=${genre.slug}#resultados`} className={`sd-genre ${selectedGenre?.slug === genre.slug ? "is-active" : ""}`} aria-current={selectedGenre?.slug === genre.slug ? "true" : undefined}>
          {film ? <div className="sd-genre-art" aria-hidden="true"><Art movie={film} showTitle={false} className="sd-art" /></div> : <span className="sd-genre-empty-art" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}
          <span className="sd-genre-code">CA / {String(index + 1).padStart(2, "0")}</span><ArrowUpRight className="sd-genre-arrow" size={18} /><div className="sd-genre-copy"><h3>{genre.name}</h3><p>{genre.note}</p><span>{count ? `${String(count).padStart(2, "0")} ${count === 1 ? "título" : "títulos"}` : "Em breve no catálogo"}</span></div>
        </Link>;
      })}</div>
    </section>}

    {(isSearch || selectedGenre || invalidGenre) && <section id="resultados" ref={resultsRef} className="sd-results" aria-labelledby="sd-results-heading"><div className="sd-section-heading"><div><p className="sd-eyebrow">{isSearch ? searching ? "ENCONTRAMOS NO CATÁLOGO" : "AINDA NÃO SABE O QUE VER?" : "A SESSÃO É SUA"}</p><h2 id="sd-results-heading">{isSearch ? searching ? <>Resultados para “{query.trim()}”</> : "Pode ser sua próxima sessão" : selectedGenre?.name ?? "Gênero não encontrado"}</h2></div>
      <div className="sd-results-controls"><span className="sd-total" role="status" aria-live="polite">{results.length} {results.length === 1 ? "título" : "títulos"}{isSearch && !searching ? " em destaque" : ""}</span>{results.length > 1 && <label className="sd-sort"><SlidersHorizontal size={15} /><span className="sd-sr-only">Ordenar resultados</span><select aria-label="Ordenar resultados" value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">{isSearch && searching ? "Relevância" : "Destaques"}</option><option value="az">Título: A–Z</option><option value="recent">Mais recentes</option></select></label>}</div></div>
      {results.length ? <div className="sd-films-grid">{results.map((film) => <FilmCard key={film.id} film={film} onSelect={setDetails} />)}</div> : <div className="sd-empty"><Film size={36} /><h3>{invalidGenre ? "Essa categoria não está por aqui." : isSearch ? "Essa história ainda não apareceu." : "Novas histórias estão a caminho."}</h3><p>{isSearch ? "Tente menos palavras, o nome de um ator ou outro gênero." : "Explore as outras categorias para encontrar o que assistir agora."}</p>{isSearch ? <button className="sd-primary" type="button" onClick={() => searchTerm("")}>Limpar pesquisa<ArrowRight size={16} /></button> : <Link className="sd-primary" href="/streamming/generos">Ver todos os gêneros<ArrowRight size={16} /></Link>}</div>}
    </section>}

    {isSearch && !searching && <aside className="sd-discover-banner"><div><span className="sd-eyebrow">PREFERE ESCOLHER PELO CLIMA?</span><h2>Todo gênero tem sua sessão.</h2></div><Link href="/streamming/generos">Explorar gêneros<ArrowUpRight size={20} /></Link></aside>}
    <footer className="sd-footer"><span>CINEASTRA<span className="sd-accent">.</span> <small>STREAM</small></span><p>Seu lugar na próxima história.</p><Barcode seed={9} /></footer>
  </main>{details && <FilmDialog key={details.id} film={details} onClose={() => setDetails(null)} onPlay={(film, type) => openVideo(film, { type })} />}</div>;
}
