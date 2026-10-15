"use client";
import Footer from "@/components/Footer";
import React, { useMemo, useState } from "react";
import {
  X, Accessibility, Armchair, MapPin, CalendarDays, ArrowRight, Plus, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

/* ============ DADOS ============ */
const COLS = 20;
const ROWS = "ABCDEFGHIJKL".split("");

const UNAVAILABLE = {
  E: [7, 8, 13, 14],
  H: [5, 6, 9, 10, 11, 12, 13, 15, 16],
  I: [7, 8, 10, 11, 12, 13, 14],
};
const ACCESSIBLE = { G: [7, 8, 9, 12, 13, 14] };

const MOVIE = {
  title: "O Último Fotograma",
  genre: "Ação",
  duration: "2h20min",
  rating: "16 anos",
  poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=85",
};
const SESSION = { cinema: "Cine Center Plaza", room: "Sala 5", day: "Sábado, 28 Junho", time: "19h30min" };

const seatId = (row, col) => `${row}${col}`;
const getStatus = (row, col) => {
  if (UNAVAILABLE[row]?.includes(col)) return "unavailable";
  if (ACCESSIBLE[row]?.includes(col)) return "accessible";
  return "available";
};
const sortSeats = (a, b) => a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1));

/* ============ ESTILOS ============ */
const SeatStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');

    .ca-root { font-family: var(--font-sans, 'Manrope', sans-serif); }
    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }

    .perf-v { width: 14px; background: repeating-linear-gradient(180deg, var(--border) 0 12px, transparent 12px 26px); opacity: .8; }
    .tear { border-top: 2px dashed var(--border); }

    .seat-shape { border-radius: 5px 5px 2px 2px; }
    .tela {
      height: 28px; border-radius: 0 0 50% 50% / 0 0 100% 100%;
      border-bottom: 2px solid color-mix(in oklab, var(--primary) 60%, transparent);
      background: linear-gradient(to bottom, color-mix(in oklab, var(--primary) 22%, transparent), transparent);
      box-shadow: 0 14px 40px -14px var(--primary);
    }
  `}</style>
);

/* ============ ASSENTO ============ */
function Seat({ row, col, status, selected, onToggle }) {
  const id = seatId(row, col);
  const disabled = status === "unavailable";

  let look = "bg-foreground/90 shadow-[inset_0_-2px_0_rgb(0_0_0/0.25)] hover:bg-primary/70";
  if (status === "accessible") look = "bg-primary/15 border border-primary/40 text-primary hover:bg-primary/30";
  if (disabled) look = "bg-muted text-muted-foreground/70 cursor-not-allowed";
  if (selected) look = "bg-primary text-primary-foreground shadow-md shadow-primary/30";

  const label = `Assento ${id}, ${disabled ? "indisponível" : status === "accessible" ? "acessível" : "disponível"}${selected ? ", selecionado" : ""}`;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onToggle(id)}
      className={`seat-shape flex-1 aspect-[10/9] flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${look}`}
    >
      {disabled && <X className="size-[55%]" aria-hidden="true" />}
      {!disabled && status === "accessible" && <Accessibility className="size-[65%]" aria-hidden="true" />}
    </button>
  );
}

/* ============ BLOCOS DO RESUMO ============ */
function SummaryBlock({ icon: Icon, title, children }) {
  return (
    <div className="flex items-center gap-4 py-6">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div>
        <h3 className="f-display text-2xl font-black text-foreground leading-none mb-1.5">{title}</h3>
        <div className="text-sm text-muted-foreground leading-snug">{children}</div>
      </div>
    </div>
  );
}

function SeatType({ icon: Icon, title, description, tone }) {
  return (
    <div className="flex items-start gap-4">
      <span className={`flex size-16 shrink-0 items-center justify-center rounded-md ${tone}`}>
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <div>
        <h4 className="font-bold text-foreground mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-52">{description}</p>
      </div>
    </div>
  );
}

/* ============ PÁGINA ============ */
export default function SelecaoAssentos({ onContinue }) {
  const [selected, setSelected] = useState(["F9", "F10", "F11", "F12"]);
  const [zoom, setZoom] = useState(1);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const sorted = useMemo(() => [...selected].sort(sortSeats), [selected]);
  const changeZoom = (delta) => setZoom((z) => Math.min(1.4, Math.max(0.8, Math.round((z + delta) * 10) / 10)));

  return (
    <div className="ca-root min-h-screen bg-background text-foreground">
      <SeatStyles />

      <main className="max-w-[1600px] mx-auto px-5 md:px-8 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto_380px]">
          {/* ---------- ESQUERDA ---------- */}
          <div>
            <h1 className="f-display text-4xl md:text-5xl font-black leading-none mb-6">Selecione seus assentos</h1>

            <div className="flex gap-4">
              {/* mapa */}
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-card/60 p-4 md:p-6">
                <div className="overflow-x-auto">
                  <div className="mx-auto space-y-1.5" style={{ width: `${zoom * 100}%`, minWidth: 560 }}>
                    {ROWS.map((row, r) => (
                      <div key={row} className="grid grid-cols-[1.5rem_1fr] items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground">{row}</span>
                        <div className="flex justify-center">
                          <div className="flex gap-1.5" style={{ width: `${90 + r * 0.9}%` }}>
                            {Array.from({ length: COLS }, (_, c) => c + 1).map((col) => (
                              <Seat
                                key={col}
                                row={row}
                                col={col}
                                status={getStatus(row, col)}
                                selected={selected.includes(seatId(row, col))}
                                onToggle={toggle}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="tela mx-auto w-[80%]" aria-hidden="true" />
                  <span className="text-xs font-semibold text-muted-foreground">Tela</span>
                </div>
              </div>

              {/* zoom */}
              <div className="hidden sm:flex h-fit flex-col items-center gap-3 rounded-md border border-border bg-card/60 p-2">
                <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label="Aproximar" onClick={() => changeZoom(0.1)}>
                  <Plus className="size-4" />
                </Button>
                <div className="h-44">
                  <Slider
                    orientation="vertical"
                    min={0.8}
                    max={1.4}
                    step={0.1}
                    value={[zoom]}
                    onValueChange={([v]) => setZoom(v)}
                    aria-label="Zoom do mapa"
                    className="h-full"
                  />
                </div>
                <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label="Afastar" onClick={() => changeZoom(-0.1)}>
                  <Minus className="size-4" />
                </Button>
              </div>
            </div>

            {/* status */}
            <div className="mt-6">
              <h2 className="text-sm font-bold mb-2">Status</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-card/60 px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="seat-shape size-5 bg-foreground/90" />Disponível</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="seat-shape flex size-5 items-center justify-center bg-muted text-muted-foreground/70"><X className="size-3" aria-hidden="true" /></span>Indisponível</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="seat-shape size-5 bg-primary" />Selecionado</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="seat-shape flex size-5 items-center justify-center border border-primary/40 bg-primary/15 text-primary"><Accessibility className="size-3" aria-hidden="true" /></span>Acessível</div>
              </div>
            </div>

            <div className="my-8 h-px bg-primary" aria-hidden="true" />

            {/* tipos de assento */}
            <h2 className="f-display text-3xl font-black mb-5">Tipos de assento</h2>
            <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr]">
              <SeatType
                icon={Armchair}
                title="Normal"
                tone="bg-muted text-foreground"
                description="Conforto padrão para uma ótima experiência."
              />
              <div className="hidden sm:block w-px bg-primary" aria-hidden="true" />
              <SeatType
                icon={Accessibility}
                title="Acessível"
                tone="border border-primary/40 bg-primary/10 text-primary"
                description="Espaços reservados para pessoas com mobilidade reduzida."
              />
            </div>
          </div>

          {/* divisor vertical */}
          <div className="hidden lg:block w-0.5 bg-primary" aria-hidden="true" />

          {/* ---------- DIREITA: RESUMO ---------- */}
          <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Resumo da compra">
            <h2 className="f-display text-4xl md:text-5xl font-black leading-none mb-6">Resumo da compra</h2>

            <div className="flex gap-4 pb-6">
              <img src={MOVIE.poster} alt={`Pôster de ${MOVIE.title}`} className="w-24 aspect-[3/4] rounded-md border border-border object-cover" />
              <div>
                <h3 className="f-display text-3xl font-black leading-none mb-2">{MOVIE.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{MOVIE.genre} · {MOVIE.duration}</p>
                <Badge variant="outline" className="rounded-sm border-border text-[11px] font-bold">{MOVIE.rating}</Badge>
              </div>
            </div>

            <div className="h-px bg-primary" aria-hidden="true" />
            <SummaryBlock icon={MapPin} title="Cinema">
              <p>{SESSION.cinema}</p>
              <p>{SESSION.room}</p>
            </SummaryBlock>

            <div className="h-px bg-primary" aria-hidden="true" />
            <SummaryBlock icon={CalendarDays} title="Dia e horário">
              <p>{SESSION.day}</p>
              <p>{SESSION.time}</p>
            </SummaryBlock>

            <div className="h-px bg-primary" aria-hidden="true" />
            <div className="py-6">
              <h3 className="f-display text-2xl font-black leading-none mb-2">Assentos</h3>
              {sorted.length === 0 ? (
                <p className="text-sm text-muted-foreground">Escolha pelo menos um assento no mapa.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5" aria-live="polite">
                  {sorted.map((s) => (
                    <Badge key={s} className="rounded-sm bg-primary/15 border border-primary/40 text-primary font-bold">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="h-px bg-primary" aria-hidden="true" />

            <Button
              size="lg"
              disabled={sorted.length === 0}
              onClick={() => onContinue?.({ movie: MOVIE, session: SESSION, seats: sorted })}
              className="mt-8 h-12 w-full rounded-full text-base font-bold shadow-md shadow-primary/20"
            >
              Continuar <ArrowRight className="size-4 ml-2" aria-hidden="true" />
            </Button>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}