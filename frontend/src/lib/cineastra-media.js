import { TITLES } from "./cineastra-titles";
/* Cadastre os arquivos reais aqui. Os títulos sem src exibem uma mensagem,
   nunca outro filme. /cineastra-demo é somente a demonstração incluída. */
const demo = {
  src: "/cineastra-demo/projecao.mp4",
  poster: "/cineastra-demo/cartaz.jpg",
  captions: [{ src: "/cineastra-demo/pt-BR.vtt", label: "Português", lang: "pt-BR" }],
  thumbnails: Array.from({ length: 6 }, (_, i) => ({ time: i * 10, src: `/cineastra-demo/frame-${i}.jpg` })),
};

export const MEDIA = {
  "demo-filme": { ...demo, id: "demo-filme", type: "movie", title: "O Último Fotograma", synopsis: "Entre a luz e a memória, uma história espera para ser revelada.", year: 2026, age: "14", duration: "1 min", genre: "Suspense · Drama", audio: "Sem diálogos", captionLanguages: "Português", trailerId: "demo-trailer" },
  "demo-trailer": { ...demo, id: "demo-trailer", type: "trailer", title: "O Último Fotograma", synopsis: "Uma prévia da próxima sessão.", label: "Trailer demonstrativo" },
  "demo-serie": {
    id: "demo-serie", type: "series", title: "Arquivo de Projeção", poster: demo.poster,
    synopsis: "Uma coleção de arquivos de uma antiga cabine de projeção revela histórias que nunca chegaram à tela. Cada episódio acompanha uma nova descoberta.", year: 2026, age: "12", genre: "Mistério · Drama", audio: "Sem diálogos", captionLanguages: "Português", trailerId: "demo-trailer",
    seasons: [1, 2].map((number) => ({ number, title: `Temporada ${number}`, episodes: [1, 2, 3].map((ep) => ({
      ...demo, id: `t${number}e${ep}`, number: ep, title: ["A primeira luz", "Entre os fotogramas", "Depois da sessão"][ep - 1],
      synopsis: "Trecho demonstrativo do player CineAstra.", duration: "1 min",
    })) })),
  },
};

export function resolveMedia(item, type = "movie") {
  if (typeof item === "string") {
    const key = type === "trailer" && !item.endsWith("-trailer") ? `${item}-trailer` : item;
    return MEDIA[key] ?? TITLES[key] ?? { id: key, title: item, type };
  }
  if (!item) return { id: "indisponivel", title: "Vídeo indisponível", type };
  const key = type === "trailer" ? `${item.id}-trailer` : item.id;
  const registered = MEDIA[key];
  const source = registered ?? item;
  return {
    ...item, ...registered, id: key, type: registered?.type ?? type,
    poster: source.backdrop ?? source.poster ?? source.image,
    src: type === "trailer" ? (registered?.src ?? item.trailerSrc ?? item.trailerUrl) : (registered?.src ?? item.src ?? item.videoUrl),
  };
}
