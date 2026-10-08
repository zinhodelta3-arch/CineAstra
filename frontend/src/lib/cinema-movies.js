// Catálogo demonstrativo baseado nos filmes fictícios do código enviado.
const image = (id, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const MOVIES = [
  {
    id: "m-1",
    slug: "o-ultimo-fotograma",
    title: "O Último Fotograma",
    genre: "Suspense · Drama",
    duration: "2h 08min",
    age: "14",
    score: "4.9",
    poster: image("photo-1478720568477-152d9b164e26"),
    synopsis:
      "Um misterioso fotógrafo descobre rolos de filme não revelados em um estúdio abandonado. Ao revelar as imagens, ele encontra registros de acontecimentos que ainda não ocorreram. Cada fotografia o aproxima de uma história capaz de reescrever o passado e ameaçar o futuro.",
    originalTitle: "O Último Fotograma",
    release: "01 de outubro de 2026",
    director: "Marina Duarte",
    cast: ["Rafael Costa", "Helena Almeida", "Caio Nunes"],
    country: "Brasil",
    distributor: "Astra Pictures",
    year: "2026",
    // Não foi fornecido um trailer deste filme fictício. Preencha com um embed legítimo.
    trailerUrl: null,
  },
  {
    id: "m-2",
    slug: "constelacao-kira",
    title: "Constelação Kira",
    genre: "Ficção Científica · Aventura",
    duration: "2h 21min",
    age: "12",
    score: "4.8",
    poster: image("photo-1440404653325-ab127d49abc1"),
    synopsis:
      "Uma expedição interestelar investiga um sinal emitido das profundezas de uma nebulosa, onde as leis da física conhecidas não se aplicam.",
    originalTitle: "Constelação Kira",
    release: "01 de outubro de 2026",
    director: "André Ramos",
    cast: ["Lia Martins", "Gabriel Santos"],
    country: "Brasil",
    distributor: "Astra Pictures",
    year: "2026",
    trailerUrl: null,
  },
  {
    id: "m-3",
    slug: "mare-vermelha",
    title: "Maré Vermelha",
    genre: "Ação",
    duration: "2h 01min",
    age: "16",
    score: "4.6",
    poster: image("photo-1518709268805-4e9042af9f23"),
    synopsis:
      "Durante uma operação em alto-mar, uma equipe de resgate descobre que o pedido de socorro é parte de um plano que coloca toda a costa em perigo.",
    originalTitle: "Maré Vermelha",
    release: "01 de outubro de 2026",
    director: "Bruno Reis",
    cast: ["Luana Prado", "Pedro Azevedo"],
    country: "Brasil",
    distributor: "Astra Pictures",
    year: "2026",
    trailerUrl: null,
  },
  {
    id: "m-4",
    slug: "baile-das-sombras",
    title: "Baile das Sombras",
    genre: "Terror · Mistério",
    duration: "1h 54min",
    age: "16",
    score: "4.7",
    poster: image("photo-1497032205916-ac775f0649ae"),
    synopsis:
      "Em uma mansão vitoriana isolada, convidados para um baile de máscaras percebem que seus anfitriões pertencem a uma ordem esquecida no tempo.",
    originalTitle: "Baile das Sombras",
    release: "01 de outubro de 2026",
    director: "Alice Moraes",
    cast: ["Clara Oliveira", "Tomás Vieira"],
    country: "Brasil",
    distributor: "Astra Pictures",
    year: "2026",
    trailerUrl: null,
  },
  {
    id: "m-5",
    slug: "sete-invernos",
    title: "Sete Invernos",
    genre: "Drama",
    duration: "1h 58min",
    age: "12",
    score: "4.5",
    poster: image("photo-1500530855697-b586d89ba3ee"),
    synopsis:
      "Após sete anos longe de casa, dois irmãos se reencontram para organizar as lembranças da família e enfrentar as escolhas que os separaram.",
    originalTitle: "Sete Invernos",
    release: "01 de outubro de 2026",
    director: "Beatriz Lima",
    cast: ["Ana Castro", "Miguel Rocha"],
    country: "Brasil",
    distributor: "Astra Pictures",
    year: "2026",
    trailerUrl: null,
  },
  {
    id: "m-6",
    slug: "o-segredo-de-gaia",
    title: "O Segredo de Gaia",
    genre: "Animação · Aventura",
    duration: "1h 38min",
    age: "Livre",
    score: "4.9",
    poster: image("photo-1534447677768-be436bb09401"),
    synopsis:
      "Uma jovem guardiã e seus amigos atravessam uma floresta de mundos escondidos para recuperar a semente que mantém Gaia viva.",
    originalTitle: "O Segredo de Gaia",
    release: "01 de outubro de 2026",
    director: "Daniel Freitas",
    cast: ["Isabela Melo", "Lucas Fernandes"],
    country: "Brasil",
    distributor: "Astra Pictures",
    year: "2026",
    trailerUrl: null,
  },
];

export const CINEMAS = [
  {
    id: "paulista",
    name: "Shopping Astra Paulista",
    address: "Bela Vista · São Paulo, SP",
    groups: [
      {
        id: "xd-dublado",
        format: "XD",
        dimension: "2D",
        language: "Dublado",
        room: "Sala 2",
        accessibility: "Libras · Audiodescrição · Legenda descritiva",
        price: 38,
        times: [{ time: "10:00" }, { time: "15:30" }, { time: "17:00" }],
      },
      {
        id: "xd-legendado",
        format: "XD",
        dimension: "2D",
        language: "Legendado",
        room: "Sala 1",
        accessibility: "Audiodescrição · Legenda descritiva",
        price: 38,
        times: [
          { time: "13:00" },
          { time: "19:00", soldOut: true },
          { time: "21:30" },
        ],
      },
      {
        id: "imax-dublado",
        format: "IMAX",
        dimension: "3D",
        language: "Dublado",
        room: "Sala 5",
        accessibility: "Libras · Audiodescrição · Legenda descritiva",
        price: 52,
        times: [{ time: "13:00" }, { time: "18:30" }, { time: "21:30" }],
      },
      {
        id: "vip-legendado",
        format: "VIP",
        dimension: "2D",
        language: "Legendado",
        room: "Sala 4",
        accessibility: "Audiodescrição · Legenda descritiva",
        price: 64,
        times: [{ time: "16:00" }, { time: "20:45" }],
      },
    ],
  },
  {
    id: "abc",
    name: "Shopping Astra ABC",
    address: "Centro · Santo André, SP",
    groups: [
      {
        id: "abc-xd",
        format: "XD",
        dimension: "2D",
        language: "Dublado",
        room: "Sala 3",
        accessibility: "Libras · Audiodescrição · Legenda descritiva",
        price: 38,
        times: [
          { time: "14:30" },
          { time: "17:15" },
          { time: "20:00" },
          { time: "22:30" },
        ],
      },
      {
        id: "abc-imax",
        format: "IMAX",
        dimension: "3D",
        language: "Legendado",
        room: "Sala 6",
        accessibility: "Audiodescrição · Legenda descritiva",
        price: 52,
        times: [{ time: "15:00" }, { time: "18:20" }, { time: "21:10" }],
      },
    ],
  },
];

export function getScreeningDays(reference = new Date().toISOString()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(reference));
  const part = (type) => parts.find((entry) => entry.type === type).value;
  const first = new Date(
    `${part("year")}-${part("month")}-${part("day")}T12:00:00Z`,
  );
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(first.getUTCDate() + index);
    return {
      id: date.toISOString().slice(0, 10),
      label:
        index === 0
          ? "Hoje"
          : index === 1
            ? "Amanhã"
            : new Intl.DateTimeFormat("pt-BR", {
                weekday: "short",
                timeZone: "UTC",
              })
                .format(date)
                .replace(".", ""),
      short: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }).format(date),
      full: new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "full",
        timeZone: "UTC",
      }).format(date),
    };
  });
}

export const formatMoney = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
