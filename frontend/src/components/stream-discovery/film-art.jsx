"use client";
import { useId } from "react";
const PALETTES = [
  { bg1: "#353323", bg2: "#14130b", a: "#fad241", b: "#971d00", t: "#ece1dc" }, // 0 dourado
  { bg1: "#7c1029", bg2: "#1b0710", a: "#fad241", b: "#ece1dc", t: "#ece1dc" }, // 1 vinho
  { bg1: "#971d00", bg2: "#2a0d05", a: "#fad241", b: "#ece1dc", t: "#ece1dc" }, // 2 vermelho
  { bg1: "#14130b", bg2: "#353323", a: "#971d00", b: "#fad241", t: "#fad241" }, // 3 noite
  { bg1: "#fad241", bg2: "#971d00", a: "#14130b", b: "#ece1dc", t: "#ece1dc" }, // 4 amarelo
  { bg1: "#ece1dc", bg2: "#7c1029", a: "#14130b", b: "#971d00", t: "#ece1dc" }, // 5 creme
  { bg1: "#0e3b43", bg2: "#061a1e", a: "#f4a259", b: "#5bc0be", t: "#ece1dc" }, // 6 petróleo
  { bg1: "#1b2a49", bg2: "#0b1222", a: "#f6c667", b: "#e4572e", t: "#ece1dc" }, // 7 marinho
  { bg1: "#1f3d2b", bg2: "#0b1a11", a: "#f2e8a0", b: "#7fb069", t: "#f2e8a0" }, // 8 floresta
  { bg1: "#3b1f5c", bg2: "#150a24", a: "#ff8fab", b: "#fad241", t: "#ece1dc" }, // 9 ameixa
  { bg1: "#c8742c", bg2: "#4a1f08", a: "#fbe3b0", b: "#14130b", t: "#fbe3b0" }, // 10 areia
  { bg1: "#cfe3ee", bg2: "#2d4a63", a: "#14202b", b: "#ffffff", t: "#ffffff" }, // 11 gelo
];

const seeded = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return () => (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
};

const wrapTitle = (t) => {
  const lines = [];
  let cur = "";
  for (const w of t.toUpperCase().split(" ")) {
    if ((cur + " " + w).trim().length > 11 && cur) { lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
};

function Motif({ kind, p, r }) {
  switch (kind) {
    case "sun":
      return (
        <g>
          <circle cx="400" cy="290" r="150" fill={p.a} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="240" y={310 + i * 22} width="320" height={4 + i * 3} fill={p.bg2} />)}
          <rect x="0" y="470" width="800" height="330" fill={p.bg2} opacity=".55" />
        </g>
      );
    case "city":
      return (
        <g>
          <circle cx="570" cy="200" r="70" fill={p.b} opacity=".9" />
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 120 + r() * 260;
            return <rect key={i} x={80 + i * 52} y={560 - h} width="44" height={h} fill={p.a} opacity={0.35 + r() * 0.5} />;
          })}
        </g>
      );
    case "rings":
      return (
        <g fill="none">
          {[250, 200, 150, 100].map((rad, i) => <circle key={rad} cx="400" cy="300" r={rad} stroke={i % 2 ? p.b : p.a} strokeWidth="10" />)}
          <circle cx="400" cy="300" r="48" fill={p.b} />
        </g>
      );
    case "mountains":
      return (
        <g>
          <circle cx="400" cy="230" r="90" fill={p.b} />
          <polygon points="0,560 220,260 400,460 560,230 800,560" fill={p.a} opacity=".55" />
          <polygon points="0,620 180,400 360,540 520,360 800,620" fill={p.bg2} opacity=".85" />
        </g>
      );
    case "stripes":
      return (
        <g transform="rotate(-18 400 300)">
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x="-100" y={40 + i * 60} width="1000" height={i % 2 ? 10 : 26} fill={i % 3 === 0 ? p.b : p.a} opacity=".85" />
          ))}
        </g>
      );
    case "eye":
      return (
        <g>
          <path d="M120 300 Q400 90 680 300 Q400 510 120 300Z" fill="none" stroke={p.a} strokeWidth="12" />
          <circle cx="400" cy="300" r="95" fill={p.b} />
          <circle cx="400" cy="300" r="42" fill={p.bg2} />
        </g>
      );
    case "stars":
      return (
        <g>
          {Array.from({ length: 70 }).map((_, i) => <circle key={i} cx={r() * 800} cy={r() * 600} r={1 + r() * 3} fill={p.b} opacity={0.4 + r() * 0.6} />)}
          <circle cx="400" cy="290" r="110" fill={p.a} />
          <ellipse cx="400" cy="290" rx="230" ry="46" fill="none" stroke={p.b} strokeWidth="9" transform="rotate(-16 400 290)" />
        </g>
      );
    case "door":
      return (
        <g>
          <polygon points="335,560 465,560 580,640 220,640" fill={p.a} opacity=".3" />
          <path d="M290 560 V300 A110 110 0 0 1 510 300 V560 Z" fill={p.a} opacity=".9" />
          <path d="M330 560 V305 A70 70 0 0 1 470 305 V560 Z" fill={p.bg2} />
        </g>
      );

    /* ---- novos motivos ---- */
    case "reel":
      return (
        <g>
          <circle cx="400" cy="290" r="210" fill="none" stroke={p.a} strokeWidth="14" />
          <circle cx="400" cy="290" r="60" fill={p.b} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const ang = (i * 60 * Math.PI) / 180;
            return <circle key={i} cx={400 + Math.cos(ang) * 125} cy={290 + Math.sin(ang) * 125} r="38" fill={p.bg2} stroke={p.a} strokeWidth="6" />;
          })}
        </g>
      );
    case "mask":
      return (
        <g>
          <path d="M190 190 Q400 100 610 190 Q640 430 400 550 Q160 430 190 190Z" fill={p.a} />
          <path d="M260 270 Q330 230 375 300 Q320 335 260 270Z" fill={p.bg2} />
          <path d="M540 270 Q470 230 425 300 Q480 335 540 270Z" fill={p.bg2} />
          <path d="M290 410 Q400 490 510 410 Q400 445 290 410Z" fill={p.b} />
        </g>
      );
    case "forest":
      return (
        <g>
          <circle cx="400" cy="200" r="95" fill={p.a} />
          {Array.from({ length: 9 }).map((_, i) => {
            const x = 40 + i * 85;
            const h = 190 + r() * 170;
            return <polygon key={i} points={`${x},570 ${x + 48},${570 - h} ${x + 96},570`} fill={i % 2 ? p.bg2 : p.b} opacity=".88" />;
          })}
        </g>
      );
    case "curtain":
      return (
        <g>
          <polygon points="360,0 440,0 650,560 150,560" fill={p.a} opacity=".3" />
          <path d="M0 0 H310 Q240 280 285 570 H0Z" fill={p.b} />
          <path d="M800 0 H490 Q560 280 515 570 H800Z" fill={p.b} />
          <path d="M0 0 H310 Q270 280 300 570 H260 Q215 280 270 0Z" fill={p.bg2} opacity=".35" />
          <ellipse cx="400" cy="560" rx="230" ry="30" fill={p.a} opacity=".7" />
        </g>
      );
    case "beam":
      return (
        <g>
          <polygon points="150,280 740,60 740,520" fill={p.a} opacity=".38" />
          <rect x="735" y="50" width="26" height="480" fill={p.b} />
          <rect x="50" y="245" width="110" height="80" rx="8" fill={p.a} />
          <circle cx="80" cy="212" r="32" fill="none" stroke={p.a} strokeWidth="8" />
          <circle cx="135" cy="212" r="32" fill="none" stroke={p.a} strokeWidth="8" />
        </g>
      );
    case "crosshair":
      return (
        <g fill="none" strokeLinecap="round">
          <circle cx="400" cy="290" r="190" stroke={p.a} strokeWidth="10" />
          <circle cx="400" cy="290" r="100" stroke={p.b} strokeWidth="8" />
          <line x1="400" y1="50" x2="400" y2="190" stroke={p.a} strokeWidth="10" />
          <line x1="400" y1="390" x2="400" y2="530" stroke={p.a} strokeWidth="10" />
          <line x1="160" y1="290" x2="300" y2="290" stroke={p.a} strokeWidth="10" />
          <line x1="500" y1="290" x2="640" y2="290" stroke={p.a} strokeWidth="10" />
          <circle cx="400" cy="290" r="14" fill={p.b} stroke="none" />
        </g>
      );
    case "moon":
      return (
        <g>
          {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={r() * 800} cy={r() * 400} r={1 + r() * 2.5} fill={p.b} opacity={0.4 + r() * 0.6} />)}
          <circle cx="400" cy="250" r="170" fill={p.a} />
          <circle cx="485" cy="205" r="150" fill={p.bg1} />
          <rect x="0" y="440" width="800" height="76" fill={p.bg2} opacity=".85" />
          {Array.from({ length: 14 }).map((_, i) => (
            <g key={i}>
              <rect x={14 + i * 58} y="450" width="30" height="14" rx="3" fill={p.a} />
              <rect x={14 + i * 58} y="492" width="30" height="14" rx="3" fill={p.a} />
            </g>
          ))}
        </g>
      );
    case "train":
      return (
        <g>
          <circle cx="400" cy="215" r="115" fill={p.b} />
          <polygon points="345,325 455,325 650,570 150,570" fill={p.bg2} opacity=".85" />
          <line x1="365" y1="325" x2="235" y2="570" stroke={p.a} strokeWidth="10" />
          <line x1="435" y1="325" x2="565" y2="570" stroke={p.a} strokeWidth="10" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const half = 40 + i * 30;
            return <rect key={i} x={400 - half} y={350 + i * 36} width={half * 2} height={7 + i * 2} fill={p.a} opacity=".7" />;
          })}
        </g>
      );
    case "house":
      return (
        <g>
          {[250, 310, 370].map((rad, i) => <circle key={rad} cx="400" cy="320" r={rad} fill="none" stroke={p.b} strokeWidth="6" opacity={0.6 - i * 0.15} />)}
          <polygon points="400,130 625,305 175,305" fill={p.a} />
          <rect x="225" y="305" width="350" height="250" fill={p.a} opacity=".92" />
          <rect x="362" y="410" width="76" height="145" fill={p.bg2} />
          <rect x="268" y="345" width="62" height="62" fill={p.bg2} />
          <rect x="470" y="345" width="62" height="62" fill={p.bg2} />
        </g>
      );
    case "desert":
      return (
        <g>
          <circle cx="540" cy="215" r="105" fill={p.b} />
          <path d="M0 470 Q200 340 400 455 T800 430 V570 H0Z" fill={p.a} opacity=".85" />
          <path d="M0 530 Q250 430 500 530 T800 510 V600 H0Z" fill={p.bg2} opacity=".8" />
          <rect x="195" y="345" width="26" height="130" rx="13" fill={p.bg2} />
          <path d="M208 410 h-38 v-52" stroke={p.bg2} strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M208 390 h38 v-44" stroke={p.bg2} strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "duo":
      return (
        <g>
          <circle cx="325" cy="250" r="145" fill={p.a} />
          <circle cx="475" cy="250" r="145" fill={p.b} opacity=".82" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x="120" y={445 + i * 30} width="560" height={6 + i * 2} rx="4" fill={p.bg2} opacity={0.8 - i * 0.12} />)}
        </g>
      );
    case "lighthouse": {
      const L = (y) => 372 - ((y - 200) * 22) / 340;
      const R = (y) => 428 + ((y - 200) * 22) / 340;
      return (
        <g>
          <polygon points="420,150 800,50 800,300" fill={p.a} opacity=".35" />
          <polygon points="380,150 0,50 0,300" fill={p.a} opacity=".35" />
          <circle cx="400" cy="180" r="70" fill={p.a} opacity=".3" />
          <polygon points="350,545 450,545 428,200 372,200" fill={p.a} />
          {[[270, 330], [400, 460]].map(([y1, y2]) => (
            <polygon key={y1} points={`${L(y1)},${y1} ${R(y1)},${y1} ${R(y2)},${y2} ${L(y2)},${y2}`} fill={p.b} />
          ))}
          <rect x="374" y="158" width="52" height="42" fill={p.b} />
          <polygon points="364,158 436,158 400,118" fill={p.bg2} />
          <rect x="0" y="545" width="800" height="60" fill={p.bg2} opacity=".75" />
        </g>
      );
    }
    case "rocket":
      return (
        <g>
          {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={r() * 800} cy={r() * 560} r={1 + r() * 2.5} fill={p.b} opacity={0.3 + r() * 0.6} />)}
          <ellipse cx="400" cy="300" rx="310" ry="62" fill="none" stroke={p.a} strokeWidth="6" opacity=".6" transform="rotate(-20 400 300)" />
          <polygon points="335,365 245,480 335,445" fill={p.b} />
          <polygon points="465,365 555,480 465,445" fill={p.b} />
          <path d="M360 440 Q400 590 440 440Z" fill={p.b} opacity=".9" />
          <ellipse cx="400" cy="280" rx="72" ry="170" fill={p.a} />
          <path d="M330 255 Q400 30 470 255Z" fill={p.b} />
          <circle cx="400" cy="270" r="34" fill={p.bg2} stroke={p.b} strokeWidth="8" />
        </g>
      );
    case "equalizer":
      return (
        <g>
          {Array.from({ length: 17 }).map((_, i) => {
            const h = 40 + (Math.sin(i * 0.7) + 1) * 70 + r() * 40;
            return <rect key={i} x={92 + i * 38} y={300 - h} width="26" height={h * 2} rx="13" fill={i % 2 ? p.b : p.a} opacity=".92" />;
          })}
        </g>
      );
    case "fog":
      return (
        <g>
          <circle cx="400" cy="195" r="85" fill={p.a} opacity=".75" />
          <polygon points="0,545 150,300 280,460 420,255 600,470 720,335 800,430 800,570 0,570" fill={p.bg2} opacity=".9" />
          {[320, 392, 466].map((y, i) => <rect key={y} x={i % 2 ? 60 : -40} y={y} width="780" height="46" rx="23" fill={p.t} opacity=".2" />)}
        </g>
      );
    case "boat":
      return (
        <g>
          <circle cx="570" cy="165" r="72" fill={p.a} />
          <polygon points="404,335 404,150 535,335" fill={p.t} opacity=".92" />
          <polygon points="392,335 392,215 295,335" fill={p.a} />
          <polygon points="268,335 540,335 478,398 330,398" fill={p.b} />
          {[0, 1, 2, 3].map((i) => {
            const y = 385 + i * 44;
            return <path key={i} d={`M0 ${y} Q100 ${y - 38} 200 ${y} T400 ${y} T600 ${y} T800 ${y}`} fill="none" stroke={p.a} strokeWidth="8" opacity={0.95 - i * 0.15} />;
          })}
        </g>
      );

    case "waves":
    default:
      return (
        <g>
          <circle cx="400" cy="230" r="100" fill={p.b} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const y = 340 + i * 36;
            return <path key={i} d={`M0 ${y} Q100 ${y - 40} 200 ${y} T400 ${y} T600 ${y} T800 ${y}`} fill="none" stroke={p.a} strokeWidth="8" opacity={1 - i * 0.12} />;
          })}
        </g>
      );
  }
}

function FilmArt({ movie, showTitle = true, className = "" }) {
  const id = useId().replace(/:/g, "");
  const p = PALETTES[movie.pal % PALETTES.length];
  const r = seeded(movie.id);
  const lines = wrapTitle(movie.title);
  const maxLen = Math.max(...lines.map((l) => l.length));
  const size = Math.min(120, Math.max(56, 520 / (maxLen * 0.5)));
  const lh = size * 0.9;
  const lastY = 600;

  return (
    <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`Arte de ${movie.title}`}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg1} /><stop offset="1" stopColor={p.bg2} />
        </linearGradient>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".4" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".75" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill={`url(#${id}-bg)`} />
      <Motif kind={movie.motif} p={p} r={r} />
      {showTitle && (
        <>
          <rect width="800" height="800" fill={`url(#${id}-sh)`} />
          {lines.map((line, i) => (
            <text key={i} x="400" y={lastY - (lines.length - 1 - i) * lh} textAnchor="middle" fontFamily="'Big Shoulders Display', Impact, sans-serif" fontWeight="900" fontSize={size} fill={p.t}>
              {line}
            </text>
          ))}
        </>
      )}
    </svg>
  );
}

export function Art({ movie, variant = "thumb", showTitle = true, className = "size-full object-cover" }) {
  const src = variant === "poster" ? movie.poster : variant === "backdrop" ? movie.backdrop : movie.thumb;
  if (src) return <img src={src} alt={`Arte de ${movie.title}`} className={className} />;
  return <FilmArt movie={movie} showTitle={showTitle && variant !== "backdrop"} className={className} />;
}

