import { FILMS } from "./stream-catalog";

// Add aliases or thematic words here without changing the search component.
export const KEYWORDS = {
  m1: ["mistério", "fotografia", "investigação", "passado"],
  m2: ["espaço", "sci-fi", "sci fi", "ficção", "planetas", "universo"],
  m3: ["perseguição", "praia", "policial"],
  m4: ["medo", "sobrenatural", "mansão"],
  m5: ["família", "neve", "inverno"],
  m6: ["família", "infantil", "natureza", "floresta", "fantasia"],
  m7: ["humor", "engraçado", "cinema"],
  m8: ["mistério", "investigação", "cinema"],
  m9: ["policial", "missão", "adrenalina"],
  m10: ["amor", "romance", "cinema"],
  m11: ["viagem", "trem", "fantasia"],
  m12: ["medo", "sobrenatural", "mistério"],
  m13: ["faroeste", "western", "deserto"],
  m14: ["futuro", "sci-fi", "sci fi", "investigação", "ficção"],
  m15: ["amizade", "verão", "humor"],
  m16: ["mar", "mistério"],
  m17: ["espaço", "sci-fi", "sci fi", "astronautas", "ficção"],
  m18: ["música", "orquestra"],
  m19: ["medo", "mistério"],
  m20: ["família", "mar", "infantil"],
};

export const GENRES = [
  { name: "Ação", slug: "acao", note: "Adrenalina em cada cena", film: "m3" },
  { name: "Aventura", slug: "aventura", note: "O próximo destino é a tela", film: "m13" },
  { name: "Comédia", slug: "comedia", note: "Pode rir. A sessão é sua", film: "m7" },
  { name: "Drama", slug: "drama", note: "Histórias que ficam", film: "m5" },
  { name: "Ficção Científica", slug: "ficcao-cientifica", note: "Além do que é possível", film: "m2" },
  { name: "Terror", slug: "terror", note: "Melhor deixar a luz acesa", film: "m4" },
  { name: "Animação", slug: "animacao", note: "Imaginação sem limites", film: "m6" },
  { name: "Religião", slug: "religiao", note: "Histórias de fé e esperança" },
  { name: "Romance", slug: "romance", note: "Um encontro com o amor" },
  { name: "Suspense", slug: "suspense", note: "Até o último fotograma", film: "m1" },
  { name: "Documentário", slug: "documentario", note: "A vida em primeiro plano" },
  { name: "Musical", slug: "musical", note: "Histórias em outro ritmo" },
];

export function normalize(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
export function belongsToGenre(film, genre) {
  return (film.genres ?? [film.genre]).some((name) => normalize(name) === normalize(genre));
}
export function searchFilms(query, catalog = FILMS) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return catalog;
  return catalog.map((film, index) => {
    const title = normalize(film.title);
    const genres = normalize((film.genres ?? [film.genre]).join(" "));
    const haystack = normalize([film.title, genres, film.cast, film.synopsis, ...(film.keywords ?? []), ...(KEYWORDS[film.id] ?? [])].join(" "));
    if (!terms.every((term) => haystack.includes(term))) return null;
    const score = terms.reduce((n, term) => n + (title.startsWith(term) ? 10 : title.includes(term) ? 6 : genres.includes(term) ? 4 : 1), 0);
    return { film, score, index };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.index - b.index).map(({ film }) => film);
}
