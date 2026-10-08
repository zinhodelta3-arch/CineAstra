"use client";

// Página autossuficiente: apenas React, HTML e CSS. Sem chamadas de rede.
import { useEffect, useRef, useState } from "react";

function Button({ children, variant = "default", size, className = "", ...props }) {
  return <button type="button" data-variant={variant} className={`cf-native-button ${className}`} {...props}>{children}</button>;
}
function Dialog({ open, onOpenChange, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="cf-native-dialog" onCancel={(event) => { event.preventDefault(); onOpenChange(false); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onOpenChange(false); } }} aria-label="Detalhes da sessão">
    <button type="button" className="cf-modal-close" aria-label="Fechar janela" onClick={() => onOpenChange(false)}>×</button>
    {open ? children : null}
  </dialog>;
}
function DialogContent({ children }) { return <div className="cf-native-dialog-body ca-film-modal">{children}</div>; }
function DialogHeader({ children }) { return <header>{children}</header>; }
function DialogTitle({ children, className }) { return <h2 className={className}>{children}</h2>; }
function DialogDescription({ children }) { return <p>{children}</p>; }

function Icon({ size = 16, className = "", path = "M4 4h16v16H4z M8 4v16 M16 4v16 M4 8h4 M16 8h4 M4 16h4 M16 16h4", ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}><path d={path}/></svg>;
}
const Film = Icon;
const Ticket = (props) => <Icon {...props} path="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z M15 5v14"/>;
const ArrowLeft = (props) => <Icon {...props} path="M19 12H5 M11 6l-6 6 6 6"/>;
const ArrowRight = (props) => <Icon {...props} path="M5 12h14 M13 6l6 6-6 6"/>;
const ChevronDown = (props) => <Icon {...props} path="m6 9 6 6 6-6"/>;
const Play = (props) => <Icon {...props} path="m7 4 14 8-14 8z"/>;
const Plus = (props) => <Icon {...props} path="M12 5v14 M5 12h14"/>;
const Minus = (props) => <Icon {...props} path="M5 12h14"/>;
const Star = (props) => <Icon {...props} path="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9z"/>;
const Clock3 = (props) => <Icon {...props} path="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5h4"/>;
const CalendarDays = (props) => <Icon {...props} path="M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h1 M14 14h1 M8 17h1"/>;
const MapPin = (props) => <Icon {...props} path="M12 22s8-8 8-14A8 8 0 0 0 4 8c0 6 8 14 8 14 M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6"/>;
const Accessibility = (props) => <Icon {...props} path="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M4 9h16 M12 7v7 M12 14l-5 7 M12 14l5 7"/>;

const POSTER = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><radialGradient id="g"><stop stop-color="#d18e87"/><stop offset=".5" stop-color="#64404d"/><stop offset="1" stop-color="#15131c"/></radialGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="350" cy="245" r="120" fill="#e4c1a8" opacity=".5"/><path d="M0 480 230 320 340 420 600 270v530H0z" fill="#181622"/><path d="M0 630 210 410 390 580 600 380v420H0z" fill="#0f1019"/><path d="m300 470-35 190h90l-30-190z" fill="#05050a"/><circle cx="300" cy="451" r="20" fill="#05050a"/><g fill="none" stroke="#d1b59f" opacity=".3"><rect x="25" y="25" width="550" height="750"/><path d="M40 55h520 M40 735h520"/></g></svg>`);
const movie = {
    id: "m-1",
    slug: "o-ultimo-fotograma",
    title: "O Último Fotograma",
    genre: "Suspense · Drama",
    duration: "2h 08min",
    age: "14",
    score: "4.9",
    poster: POSTER,
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
  };
const days = [
 {id:"demo-1",label:"Qui",short:"08/10",full:"Quinta-feira, 08 de outubro — exemplo"},
 {id:"demo-2",label:"Sex",short:"09/10",full:"Sexta-feira, 09 de outubro — exemplo"},
 {id:"demo-3",label:"Sáb",short:"10/10",full:"Sábado, 10 de outubro — exemplo"},
 {id:"demo-4",label:"Dom",short:"11/10",full:"Domingo, 11 de outubro — exemplo"},
 {id:"demo-5",label:"Seg",short:"12/10",full:"Segunda-feira, 12 de outubro — exemplo"},
];
const formatMoney = (value) => new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(value);
const CINEMAS = [
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


const PAGE_CSS = "/* Exclusivo da página de filme. As cores vêm do tema TweakCN já existente. */\n.ca-film {\n  height: calc(100dvh - var(--cineastra-header-height, 0px));\n  display: flex;\n  flex-direction: column;\n  font-family: var(--font-sans, \"Manrope\", sans-serif);\n  background: var(--background, #141114);\n  color: var(--foreground, #EDE6DE);\n}\n.ca-film .cf-filmstrip {\n  flex: 0 0 12px;\n  height: 12px;\n  background: repeating-linear-gradient(\n    90deg,\n    var(--primary, #CF4D63) 0 12px,\n    transparent 12px 26px\n  );\n  opacity: 0.65;\n}\n.ca-film .cf-frame {\n  flex: 1;\n  display: grid;\n  grid-template-columns: minmax(0, 1.42fr) minmax(0, 1fr);\n  min-height: 0;\n  max-width: 1600px;\n  width: 100%;\n  margin-inline: auto;\n}\n.ca-film .cf-program {\n  display: flex;\n  flex-direction: column;\n  min-height: 0;\n  min-width: 0;\n}\n.ca-film .cf-program-head {\n  flex: none;\n  padding: 27px 42px 0;\n}\n.ca-film .cf-back {\n  color: var(--muted-foreground, #A59A9D);\n  text-decoration: none;\n  transition: color 0.18s;\n}\n.ca-film .cf-back:hover {\n  color: var(--primary, #CF4D63);\n}\n.ca-film .cf-section-label {\n  margin: 28px 0 10px;\n  font-size: 10px;\n  font-weight: 800;\n  letter-spacing: 0.18em;\n  color: var(--primary, #CF4D63);\n}\n.ca-film .cf-heading {\n  margin: 0;\n  font-family: \"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif;\n  font-size: clamp(38px, 4.2vw, 65px);\n  font-weight: 900;\n  line-height: 1;\n  letter-spacing: -0.025em;\n}\n.ca-film .cf-showing {\n  margin: 12px 0 22px;\n  font-size: 12px;\n  line-height: 1.5;\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film .cf-showing strong {\n  font-weight: 600;\n  color: var(--foreground, #EDE6DE);\n}\n.ca-film .cf-field-label {\n  display: block;\n  margin: 0 0 7px;\n  font-size: 10px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film .cf-address {\n  margin: 9px 0 20px;\n  font-size: 11px;\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film .cf-days {\n  display: flex;\n  gap: 7px;\n  overflow-x: auto;\n  padding-bottom: 6px;\n  scrollbar-width: thin;\n}\n.ca-film .cf-day {\n  display: flex;\n  flex: 1 0 57px;\n  min-width: 57px;\n  flex-direction: column;\n  align-items: center;\n  gap: 5px;\n  padding: 11px 8px;\n  border: 1px solid var(--border, #342B30);\n  border-radius: 6px;\n  background: transparent;\n  color: var(--muted-foreground, #A59A9D);\n  cursor: pointer;\n}\n.ca-film .cf-day > span {\n  font-size: 10px;\n  text-transform: capitalize;\n}\n.ca-film .cf-day strong {\n  font-size: 13px;\n  color: var(--foreground, #EDE6DE);\n}\n.ca-film .cf-day[aria-pressed=\"true\"] {\n  background: var(--primary, #CF4D63);\n  border-color: var(--primary, #CF4D63);\n  color: var(--primary-foreground, #FFF9F7);\n}\n.ca-film .cf-day[aria-pressed=\"true\"] strong {\n  color: var(--primary-foreground, #FFF9F7);\n}\n.ca-film .cf-filters {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  flex-wrap: wrap;\n  gap: 12px;\n  padding: 17px 0 18px;\n  border-bottom: 1px solid var(--border, #342B30);\n}\n.ca-film .cf-format-list {\n  display: flex;\n  gap: 5px;\n}\n.ca-film .cf-format {\n  padding: 7px 12px;\n  border: 1px solid transparent;\n  border-radius: 999px;\n  background: transparent;\n  color: var(--muted-foreground, #A59A9D);\n  font-size: 10px;\n  font-weight: 700;\n  cursor: pointer;\n}\n.ca-film .cf-format[aria-pressed=\"true\"] {\n  border-color: var(--border, #342B30);\n  background: var(--secondary);\n  color: var(--secondary-foreground);\n}\n.ca-film .cf-language {\n  min-width: 147px;\n}\n.ca-film .cf-session-scroll {\n  flex: 1;\n  min-height: 0;\n  overflow-y: auto;\n  overscroll-behavior-y: contain;\n  padding: 18px 42px 24px;\n  scrollbar-width: thin;\n  scrollbar-color: var(--border, #342B30) transparent;\n}\n.ca-film .cf-session-date {\n  font-size: 10px;\n  color: var(--muted-foreground, #A59A9D);\n  text-transform: capitalize;\n  margin-bottom: 3px;\n}\n.ca-film .cf-session-group {\n  padding: 23px 0;\n  border-bottom: 1px dashed var(--border, #342B30);\n}\n.ca-film .cf-group-top {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 16px;\n  margin-bottom: 16px;\n}\n.ca-film .cf-room-line {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  font-size: 11px;\n  font-weight: 600;\n}\n.ca-film .cf-room-format {\n  font-size: 15px;\n  font-weight: 900;\n  color: var(--foreground, #EDE6DE);\n  letter-spacing: -0.025em;\n}\n.ca-film .cf-room-line > span:not(:first-child) {\n  color: var(--muted-foreground, #A59A9D);\n  border-left: 1px solid var(--border, #342B30);\n  padding-left: 9px;\n}\n.ca-film .cf-room-name {\n  margin: 7px 0 0;\n  font-size: 10px;\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film .cf-prices {\n  text-align: right;\n  border: 0;\n  background: transparent;\n  padding: 0;\n  color: var(--primary, #CF4D63);\n  cursor: pointer;\n  flex-shrink: 0;\n}\n.ca-film .cf-prices > span {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 6px;\n  font-size: 12px;\n  font-weight: 700;\n}\n.ca-film .cf-prices small {\n  display: block;\n  margin-top: 6px;\n  font-size: 9px;\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film .cf-prices:hover > span {\n  text-decoration: underline;\n}\n.ca-film .cf-tickets {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 11px;\n}\n.ca-film .cf-ticket {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  padding: 12px 16px 10px;\n  gap: 4px;\n  min-width: 0;\n  background: var(--primary, #CF4D63);\n  color: var(--primary-foreground, #FFF9F7);\n  border: 0;\n  border-radius: 3px;\n  cursor: pointer;\n  -webkit-mask:\n    radial-gradient(circle 5px at 0 60%, transparent 98%, black) left / 51% 100%\n      no-repeat,\n    radial-gradient(circle 5px at 100% 60%, transparent 98%, black) right / 51%\n      100% no-repeat;\n  mask:\n    radial-gradient(circle 5px at 0 60%, transparent 98%, black) left / 51% 100%\n      no-repeat,\n    radial-gradient(circle 5px at 100% 60%, transparent 98%, black) right / 51%\n      100% no-repeat;\n  transition:\n    filter 0.18s,\n    transform 0.18s;\n}\n.ca-film .cf-ticket > span {\n  font-size: 9px;\n  font-weight: 500;\n}\n.ca-film .cf-ticket-date {\n  opacity: 0.85;\n  margin-left: 2px;\n}\n.ca-film .cf-ticket > strong {\n  font-family: \"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif;\n  font-size: 31px;\n  font-weight: 800;\n  line-height: 1;\n  letter-spacing: 0.01em;\n}\n.ca-film .cf-ticket > small {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  margin-top: 5px;\n  padding-top: 7px;\n  border-top: 1px dashed currentColor;\n  font-size: 8px;\n  opacity: 0.8;\n}\n.ca-film .cf-ticket:hover:not(:disabled) {\n  filter: brightness(1.1);\n  transform: translateY(-2px);\n}\n.ca-film .cf-ticket:disabled {\n  background: var(--muted, #2A2329);\n  color: var(--muted-foreground, #A59A9D);\n  opacity: 0.65;\n  cursor: not-allowed;\n}\n.ca-film .cf-access {\n  margin: 12px 0 0;\n  font-size: 8px;\n  color: var(--muted-foreground, #A59A9D);\n  line-height: 1.5;\n}\n.ca-film .cf-demo-note {\n  margin: 24px 0 0;\n  font-size: 9px;\n  line-height: 1.8;\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film .cf-film-scroll {\n  min-height: 0;\n  min-width: 0;\n  overflow-y: auto;\n  overscroll-behavior-y: contain;\n  border-left: 1px solid var(--border, #342B30);\n  background: var(--card, #1B1619);\n  scrollbar-width: thin;\n  scrollbar-color: var(--border, #342B30) transparent;\n}\n.ca-film .cf-film-content {\n  max-width: 440px;\n  margin: 0 auto;\n  padding: 30px 30px 24px;\n}\n.ca-film .cf-poster {\n  position: relative;\n  aspect-ratio: 2 / 3;\n  overflow: hidden;\n  border-radius: 4px;\n  background: var(--secondary);\n  isolation: isolate;\n}\n.ca-film .cf-poster > img {\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  filter: saturate(0.7);\n}\n.ca-film .cf-poster-shade {\n  position: absolute;\n  inset: 0;\n  background: linear-gradient(\n    180deg,\n    #080a0e30 0%,\n    transparent 25%,\n    #080a0e75 55%,\n    #080a0eef 100%\n  );\n}\n.ca-film .cf-poster-status {\n  position: absolute;\n  top: 17px;\n  left: 17px;\n  padding: 5px 8px;\n  border: 1px solid #ffffff50;\n  background: #00000030;\n  color: #fff;\n  font-size: 8px;\n  font-weight: 700;\n  letter-spacing: 0.13em;\n}\n.ca-film .cf-poster-type {\n  position: absolute;\n  bottom: 57px;\n  left: 24px;\n  right: 24px;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  color: #fff;\n}\n.ca-film .cf-poster-type > span {\n  font-size: 7px;\n  font-weight: 600;\n  letter-spacing: 0.25em;\n}\n.ca-film .cf-poster-type > strong {\n  font-family: \"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif;\n  font-size: clamp(36px, 4.8vw, 65px);\n  font-weight: 900;\n  line-height: 0.92;\n  text-transform: uppercase;\n  max-width: 290px;\n}\n.ca-film .cf-poster-type > small {\n  font-size: 8px;\n  letter-spacing: 0.06em;\n  opacity: 0.6;\n}\n.ca-film .cf-age {\n  position: absolute;\n  right: 16px;\n  bottom: 16px;\n  display: grid;\n  place-items: center;\n  width: 28px;\n  height: 28px;\n  border-radius: 3px;\n  border: 1px solid #ffffff80;\n  background: #00000055;\n  color: #fff;\n  font-size: 13px;\n  font-weight: 800;\n}\n.ca-film .cf-movie-title-row {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 15px;\n  margin-top: 23px;\n}\n.ca-film .cf-movie-title {\n  margin: 0;\n  font-family: \"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif;\n  font-size: 34px;\n  font-weight: 800;\n  line-height: 1.04;\n}\n.ca-film .cf-score {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  font-size: 12px;\n  color: var(--primary, #CF4D63);\n  font-weight: 700;\n  margin-top: 7px;\n  flex-shrink: 0;\n}\n.ca-film .cf-score small {\n  color: var(--muted-foreground, #A59A9D);\n  font-size: 9px;\n  font-weight: 400;\n}\n.ca-film .cf-movie-meta {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  font-size: 10px;\n  color: var(--muted-foreground, #A59A9D);\n  margin-top: 10px;\n}\n.ca-film .cf-detail-section {\n  margin-top: 28px;\n}\n.ca-film .cf-detail-section > h3 {\n  font-size: 13px;\n  font-weight: 700;\n  margin: 0 0 12px;\n}\n.ca-film .cf-detail-section > p {\n  margin: 0;\n  color: var(--muted-foreground, #A59A9D);\n  font-size: 12px;\n  line-height: 1.85;\n}\n.ca-film .cf-facts {\n  margin: 0;\n}\n.ca-film .cf-facts > div {\n  display: grid;\n  grid-template-columns: 95px minmax(0, 1fr);\n  gap: 15px;\n  padding: 11px 0;\n  border-bottom: 1px solid var(--border, #342B30);\n  font-size: 10px;\n  line-height: 1.6;\n}\n.ca-film .cf-facts dt {\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film .cf-facts dd {\n  margin: 0;\n  color: var(--foreground, #EDE6DE);\n}\n.ca-film .cf-bottom-mark {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  padding-top: 32px;\n  color: var(--muted-foreground, #A59A9D);\n  opacity: 0.6;\n  font-size: 8px;\n  letter-spacing: 0.12em;\n}\n.ca-film .cf-mobile-sessions {\n  display: none;\n}\n.ca-film .cf-empty,\n.ca-film-modal .cf-empty {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  text-align: center;\n  gap: 10px;\n  padding: 32px 12px;\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film .cf-empty h2,\n.ca-film-modal .cf-empty h2 {\n  margin: 0;\n  color: var(--foreground, #EDE6DE);\n  font-size: 15px;\n  font-weight: 700;\n}\n.ca-film .cf-empty p,\n.ca-film-modal .cf-empty p {\n  margin: 0;\n  max-width: 300px;\n  font-size: 12px;\n  line-height: 1.7;\n}\n.ca-film\n  :is(\n    .cf-back,\n    .cf-day,\n    .cf-format,\n    .cf-prices,\n    .cf-session-scroll,\n    .cf-film-scroll,\n    .cf-mobile-sessions\n  ):focus-visible {\n  outline: 2px solid var(--primary, #CF4D63);\n  outline-offset: 3px;\n}\n.ca-film .cf-ticket:focus-visible {\n  outline: none;\n  box-shadow: inset 0 0 0 3px var(--primary-foreground, #FFF9F7);\n}\n.ca-film .cf-feedback:not(:empty) {\n  position: fixed;\n  z-index: 70;\n  bottom: 24px;\n  left: 50%;\n  transform: translateX(-50%);\n  max-width: calc(100vw - 32px);\n  padding: 14px 20px;\n  border: 1px solid var(--primary, #CF4D63);\n  border-radius: 8px;\n  background: var(--card, #1B1619);\n  color: var(--foreground, #EDE6DE);\n  font-size: 12px;\n  box-shadow: 0 8px 28px #0002;\n}\n.ca-film-modal .cf-modal-title {\n  font-family: \"Big Shoulders Display\", \"Arial Narrow\", Impact, sans-serif;\n  font-size: 34px;\n  font-weight: 800;\n  line-height: 1;\n}\n.ca-film-modal .cf-price-table > div {\n  display: flex;\n  justify-content: space-between;\n  padding: 16px 0;\n  border-bottom: 1px dashed var(--border, #342B30);\n  font-size: 13px;\n}\n.ca-film-modal .cf-price-table strong {\n  color: var(--primary, #CF4D63);\n}\n.ca-film-modal .cf-booking-summary {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding: 16px;\n  border: 1px dashed var(--border, #342B30);\n  border-radius: 5px;\n}\n.ca-film-modal .cf-booking-summary > strong {\n  font-size: 15px;\n}\n.ca-film-modal .cf-booking-summary > span {\n  font-size: 12px;\n}\n.ca-film-modal .cf-booking-summary > small {\n  font-size: 10px;\n  color: var(--muted-foreground, #A59A9D);\n}\n.ca-film-modal .cf-total {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding-top: 16px;\n  border-top: 1px dashed var(--border, #342B30);\n  font-size: 12px;\n}\n.ca-film-modal .cf-total strong {\n  color: var(--primary, #CF4D63);\n  font-size: 25px;\n  font-weight: 800;\n}\n@media (min-width: 1400px) {\n  .ca-film .cf-program-head {\n    padding: 40px 64px 0;\n  }\n  .ca-film .cf-session-scroll {\n    padding-inline: 64px;\n  }\n  .ca-film .cf-film-content {\n    padding-top: 40px;\n  }\n}\n@media (max-width: 1050px) and (min-width: 768px) {\n  .ca-film .cf-program-head {\n    padding: 24px 25px 0;\n  }\n  .ca-film .cf-session-scroll {\n    padding-inline: 25px;\n  }\n  .ca-film .cf-film-content {\n    padding: 25px 24px;\n  }\n  .ca-film .cf-tickets {\n    gap: 7px;\n  }\n  .ca-film .cf-ticket {\n    padding-inline: 12px;\n  }\n  .ca-film .cf-heading {\n    font-size: 46px;\n  }\n}\n@media (max-width: 767px) {\n  .ca-film {\n    height: auto;\n    min-height: calc(100dvh - var(--cineastra-header-height, 0px));\n  }\n  .ca-film .cf-frame {\n    display: flex;\n    flex-direction: column;\n  }\n  .ca-film .cf-program {\n    order: 2;\n  }\n  .ca-film .cf-film-scroll {\n    order: 1;\n    overflow: visible;\n    border: 0;\n    border-bottom: 1px solid var(--border, #342B30);\n  }\n  .ca-film .cf-film-content {\n    max-width: 490px;\n    padding: 28px 24px;\n  }\n  .ca-film .cf-poster {\n    max-width: 275px;\n    margin-inline: auto;\n  }\n  .ca-film .cf-poster-type > strong {\n    font-size: 48px;\n  }\n  .ca-film .cf-movie-title {\n    font-size: 36px;\n  }\n  .ca-film .cf-mobile-sessions {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    gap: 8px;\n    padding: 13px;\n    margin-top: 24px;\n    border-radius: 999px;\n    background: var(--primary, #CF4D63);\n    color: var(--primary-foreground, #FFF9F7);\n    font-size: 12px;\n    font-weight: 700;\n    text-decoration: none;\n  }\n  .ca-film .cf-program-head {\n    padding: 28px 24px 0;\n  }\n  .ca-film .cf-section-label {\n    margin-top: 25px;\n  }\n  .ca-film .cf-heading {\n    font-size: 44px;\n  }\n  .ca-film .cf-session-scroll {\n    overflow: visible;\n    padding: 18px 24px 35px;\n  }\n  .ca-film .cf-tickets {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n    gap: 9px;\n  }\n  .ca-film .cf-ticket {\n    padding-inline: 13px;\n  }\n  .ca-film .cf-feedback:not(:empty) {\n    bottom: 16px;\n    width: calc(100vw - 32px);\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .ca-film .cf-ticket,\n  .ca-film .cf-back {\n    transition: none;\n  }\n}\n\n.ca-film button, .ca-film select {font:inherit; cursor:pointer;}\n.ca-film button:disabled {cursor:not-allowed;}\n.ca-film .cf-native-select {width:100%; padding:11px 14px; border:1px solid var(--border,#342B30); border-radius:9px; color:var(--foreground,#EDE6DE); background:var(--card,#1B1619); font-size:13px;}\n.ca-film .cf-native-button {display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px; padding:9px 16px; border:1px solid var(--primary,#CF4D63); border-radius:999px; background:var(--primary,#CF4D63); color:var(--primary-foreground,#FFF9F7); font-size:13px;}\n.ca-film .cf-native-button[data-variant=\"outline\"] {background:transparent; color:var(--foreground,#EDE6DE); border-color:var(--border,#342B30);}\n.ca-film .cf-native-button:disabled {opacity:.4;}\n.ca-film :focus-visible {outline:2px solid var(--primary,#CF4D63); outline-offset:3px;}\n.ca-film .cf-native-dialog {width:min(450px,calc(100vw - 32px)); max-height:85dvh; overflow:auto; padding:26px; border:1px solid var(--border,#342B30); border-radius:16px; background:var(--card,#1B1619); color:var(--foreground,#EDE6DE); margin:auto;}\n.ca-film .cf-native-dialog::backdrop {background:rgb(0 0 0 / .72);}\n.ca-film .cf-native-dialog-body {display:grid; gap:20px;}\n.ca-film .cf-modal-close {float:right; border:0; background:transparent; color:inherit; padding:4px 10px; font-size:24px; margin:-10px -10px 8px 8px;}\n.ca-film .cf-native-dialog h2 {margin:0 0 8px;}\n.ca-film .cf-native-dialog header p {color:var(--muted-foreground,#A59A9D); font-size:13px; margin:0;}\n.ca-film .cf-native-dialog .cf-price-table > div {display:flex; justify-content:space-between; padding:14px 0; border-bottom:1px solid var(--border,#342B30);}\n";

const FORMATS = ["Todos", "XD", "IMAX", "VIP"];
const cinemaItems = CINEMAS.map((cinema) => ({
  value: cinema.id,
  label: cinema.name,
}));
const languageItems = [
  { value: "Todos", label: "Todos os idiomas" },
  { value: "Dublado", label: "Dublado" },
  { value: "Legendado", label: "Legendado" },
];

export default function FilmExamplePage() {
  const [cinemaId, setCinemaId] = useState(CINEMAS[0].id);
  const [dayId, setDayId] = useState(days[0].id);
  const [format, setFormat] = useState("Todos");
  const [language, setLanguage] = useState("Todos");
  const [priceGroup, setPriceGroup] = useState(null);
  const [booking, setBooking] = useState(null);
  const [count, setCount] = useState(1);
  const [ticketType, setTicketType] = useState("inteira");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const cinema = CINEMAS.find((item) => item.id === cinemaId) || CINEMAS[0];
  const day = days.find((item) => item.id === dayId) || days[0];
  const groups = cinema.groups.filter(
    (group) =>
      (format === "Todos" || group.format === format) &&
      (language === "Todos" || group.language === language),
  );
  const unitPrice = booking
    ? booking.group.price / (ticketType === "meia" ? 2 : 1)
    : 0;

  function openBooking(group, time) {
    setFeedback("");
    setCount(1);
    setTicketType("inteira");
    // Congela o cinema e a data da sessão escolhida para o resumo do pedido.
    setBooking({ group, time, cinema, day });
  }

  function addToOrder() {
    if (!booking) return;
    setBooking(null);
    setFeedback(`${count} ingresso(s) de exemplo: ${booking.day.short}, ${booking.time}. Total: ${formatMoney(unitPrice * count)}.`);
  }

  return (
    <main className="ca-film min-h-0 bg-background text-foreground">
      <style>{PAGE_CSS + `.ca-film .cf-poster {container-type:inline-size;} .ca-film .cf-poster-type > strong {font-size:clamp(26px,10cqw,38px);letter-spacing:-.04em;max-width:100%;} .ca-film .cf-native-dialog .flex {display:flex;} .ca-film .cf-native-dialog .items-center {align-items:center;} .ca-film .cf-native-dialog .justify-between {justify-content:space-between;} .ca-film .cf-native-dialog .gap-2 {gap:8px;} .ca-film .cf-native-dialog .gap-4 {gap:16px;} .ca-film .cf-native-dialog .flex-1 {flex:1;} .ca-film .cf-native-dialog .w-full {width:100%;} .ca-film .cf-native-dialog .text-xs {font-size:12px;} .ca-film .cf-native-dialog .text-sm {font-size:14px;}`}</style>
      <div className="cf-filmstrip" aria-hidden="true" />
      <div className="cf-frame">
        <section className="cf-program" aria-labelledby="cf-sessions-title">
          <div className="cf-program-head">
            <a
              href="#cf-sessions-title"
              className="cf-back inline-flex items-center gap-2 text-sm"
            >
              <ArrowLeft size={15} /> Sessões de exemplo
            </a>
            <div className="cf-section-label flex items-center gap-2">
              <Ticket size={15} /> PROGRAMAÇÃO
            </div>
            <h1 id="cf-sessions-title" className="cf-heading">
              Escolha sua sessão
            </h1>
            <p className="cf-showing">
              Horários para <strong>{movie.title}</strong>
            </p>
            <div className="cf-location-control">
              <label id="cf-cinema-label" className="cf-field-label">
                Cinema
              </label>
              <select id="cf-cinema" aria-labelledby="cf-cinema-label" className="cf-native-select" value={cinemaId} onChange={(event) => setCinemaId(event.target.value)}>
{cinemaItems.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
</select>
              <p className="cf-address flex items-center gap-1.5">
                <MapPin size={13} aria-hidden="true" /> {cinema.address}
              </p>
            </div>
            <div className="cf-days" role="group" aria-label="Data da sessão">
              {days.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="cf-day"
                  aria-label={item.full}
                  aria-pressed={item.id === dayId}
                  onClick={() => setDayId(item.id)}
                >
                  <span>{item.label}</span>
                  <strong>{item.short}</strong>
                </button>
              ))}
            </div>
            <div className="cf-filters">
              <div
                className="cf-format-list"
                role="group"
                aria-label="Formato da sala"
              >
                {FORMATS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="cf-format"
                    aria-pressed={format === value}
                    onClick={() => setFormat(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="cf-language">
                <select aria-label="Idioma da sessão" className="cf-native-select" value={language} onChange={(event) => setLanguage(event.target.value)}>
{languageItems.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
</select>
              </div>
            </div>
          </div>

          <div
            className="cf-session-scroll"
            tabIndex={0}
            aria-label="Lista de sessões"
          >
            <div className="cf-session-date flex items-center gap-2">
              <CalendarDays size={14} /> {day.full}
            </div>
            {groups.map((group) => (
              <article className="cf-session-group" key={group.id}>
                <div className="cf-group-top">
                  <div>
                    <div className="cf-room-line">
                      <span className="cf-room-format">{group.format}</span>
                      <span>{group.dimension}</span>
                      <span>{group.language}</span>
                    </div>
                    <p className="cf-room-name">
                      {group.room}
                      {group.format === "IMAX"
                        ? " · Dolby Atmos"
                        : group.format === "VIP"
                          ? " · Poltronas reclináveis"
                          : " · Projeção digital"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cf-prices"
                    onClick={() => setPriceGroup(group)}
                    aria-label={`Ver preços de ${group.format}, ${group.dimension}, ${group.language}`}
                  >
                    <span>
                      Preços <ArrowRight size={13} />
                    </span>
                    <small>a partir de {formatMoney(group.price / 2)}</small>
                  </button>
                </div>
                <div className="cf-tickets">
                  {group.times.map(({ time, soldOut }) => (
                    <button
                      type="button"
                      className="cf-ticket"
                      key={time}
                      disabled={soldOut}
                      aria-label={`${soldOut ? "Esgotado" : "Selecionar"}: ${day.full}, ${time}, ${group.format}, ${group.dimension}, ${group.language}, ${group.room}`}
                      onClick={() => openBooking(group, time)}
                    >
                      <span>
                        {day.label}{" "}
                        <span className="cf-ticket-date">{day.short}</span>
                      </span>
                      <strong>{time}</strong>
                      <small>
                        {soldOut ? "Esgotado" : "Selecionar"}{" "}
                        {!soldOut && <ArrowRight size={12} />}
                      </small>
                    </button>
                  ))}
                </div>
                <p className="cf-access flex items-center gap-1.5">
                  <Accessibility size={13} /> {group.accessibility}
                </p>
              </article>
            ))}
            {!groups.length && (
              <div className="cf-empty">
                <Film size={27} />
                <h2>Nenhuma sessão com esses filtros</h2>
                <p>
                  Escolha outro formato ou idioma para ver os horários
                  disponíveis.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-full"
                  onClick={() => {
                    setFormat("Todos");
                    setLanguage("Todos");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
            <p className="cf-demo-note">
              Programação demonstrativa. Recursos de acessibilidade mediante
              solicitação à equipe.
            </p>
          </div>
        </section>

        <aside
          className="cf-film-scroll"
          tabIndex={0}
          aria-label="Informações do filme"
        >
          <div className="cf-film-content">
            <div className="cf-poster">
              <img
                src={movie.poster}
                alt={`Imagem ilustrativa de ${movie.title}`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.opacity = "0";
                }}
              />
              <div className="cf-poster-shade" />
              <span className="cf-poster-status">EM CARTAZ</span>
              <div className="cf-poster-type" aria-hidden="true">
                <span>CINEASTRA APRESENTA</span>
                <strong>{movie.title}</strong>
                <small>
                  {movie.year} · {movie.genre}
                </small>
              </div>
              <span
                className="cf-age"
                aria-label={`Classificação indicativa: ${movie.age === "Livre" ? "Livre" : `${movie.age} anos`}`}
              >
                {movie.age === "Livre" ? "L" : movie.age}
              </span>
            </div>
            <div className="cf-movie-title-row">
              <h2 className="cf-movie-title">{movie.title}</h2>
              <span className="cf-score">
                <Star size={14} className="fill-current" /> {movie.score}
                <small>/5</small>
              </span>
            </div>
            <div className="cf-movie-meta">
              <span>{movie.genre}</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={13} /> {movie.duration}
              </span>
            </div>
            <a className="cf-mobile-sessions" href="#cf-sessions-title">
              Ver sessões <ChevronDown size={14} />
            </a>
            <Button
              variant="outline"
              className="mt-5 w-full rounded-full border-border bg-transparent"
              onClick={() => setTrailerOpen(true)}
            >
              <Play size={15} /> Assistir trailer
            </Button>
            <div className="cf-detail-section">
              <h3>Sinopse</h3>
              <p>{movie.synopsis}</p>
            </div>
            <div className="cf-detail-section">
              <h3>Ficha técnica</h3>
              <dl className="cf-facts">
                {[
                  ["Título original", movie.originalTitle],
                  ["Estreia", movie.release],
                  ["Direção", movie.director],
                  ["Elenco", movie.cast.join(", ")],
                  ["País", movie.country],
                  ["Distribuição", movie.distributor],
                  [
                    "Classificação",
                    movie.age === "Livre"
                      ? "Livre para todos os públicos"
                      : `Não recomendado para menores de ${movie.age} anos`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="cf-detail-section">
              <h3 className="flex items-center gap-2">
                <Accessibility size={16} /> Acessibilidade
              </h3>
              <p>
                Consulte os recursos disponíveis em cada sessão. Solicite os
                dispositivos de audiodescrição e Libras à equipe do cinema antes
                da entrada.
              </p>
            </div>
            <div className="cf-bottom-mark" aria-hidden="true">
              <Film size={16} />
              <span>CINEASTRA / CINEMA</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="cf-feedback" role="status" aria-live="polite">
        {feedback}
      </div>

      <Dialog
        open={!!priceGroup}
        onOpenChange={(open) => {
          if (!open) setPriceGroup(null);
        }}
      >
        <DialogContent className="ca-film-modal max-w-md border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="cf-modal-title">
              Preços da sessão
            </DialogTitle>
            <DialogDescription>
              {cinema.name} · {priceGroup?.format} · {priceGroup?.dimension} ·{" "}
              {priceGroup?.language}
            </DialogDescription>
          </DialogHeader>
          <div className="cf-price-table">
            <div>
              <span>Inteira</span>
              <strong>{formatMoney(priceGroup?.price || 0)}</strong>
            </div>
            <div>
              <span>Meia-entrada</span>
              <strong>{formatMoney((priceGroup?.price || 0) / 2)}</strong>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Valores demonstrativos. A meia-entrada exige o comprovante
            correspondente. Não há taxa de serviço nesta demonstração.
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setPriceGroup(null)}
          >
            Voltar aos horários
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!booking}
        onOpenChange={(open) => {
          if (!open) setBooking(null);
        }}
      >
        <DialogContent className="ca-film-modal max-w-md border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="cf-modal-title">Sua sessão</DialogTitle>
            <DialogDescription>
              Confira os dados do ingresso demonstrativo.
            </DialogDescription>
          </DialogHeader>
          {booking && (
            <>
              <div className="cf-booking-summary">
                <strong>{movie.title}</strong>
                <span>{booking.cinema.name}</span>
                <span>
                  {booking.day.label}, {booking.day.short} · {booking.time}
                </span>
                <small>
                  {booking.group.format} · {booking.group.dimension} ·{" "}
                  {booking.group.language} · {booking.group.room}
                </small>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Tipo de ingresso
                </p>
                <div className="flex gap-2">
                  {["inteira", "meia"].map((type) => (
                    <Button
                      key={type}
                      variant={type === ticketType ? "default" : "outline"}
                      aria-pressed={type === ticketType}
                      className="flex-1 rounded-full text-xs"
                      onClick={() => setTicketType(type)}
                    >
                      {type === "inteira" ? "Inteira" : "Meia"} ·{" "}
                      {formatMoney(
                        booking.group.price / (type === "meia" ? 2 : 1),
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Quantidade</span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    aria-label="Diminuir quantidade"
                    disabled={count === 1}
                    onClick={() => setCount((value) => Math.max(1, value - 1))}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-4 text-center font-bold">{count}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    aria-label="Aumentar quantidade"
                    disabled={count === 8}
                    onClick={() => setCount((value) => Math.min(8, value + 1))}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
              <div className="cf-total">
                <span>Total</span>
                <strong>{formatMoney(unitPrice * count)}</strong>
              </div>
              <Button className="w-full rounded-full" onClick={addToOrder}>
                <Ticket size={16} /> Confirmar exemplo
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogContent className="ca-film-modal max-w-3xl border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="cf-modal-title">{movie.title}</DialogTitle>
            <DialogDescription>Trailer</DialogDescription>
          </DialogHeader>
          {movie.trailerUrl ? (
            <div className="aspect-video overflow-hidden rounded-md bg-black">
              <iframe
                className="h-full w-full"
                src={movie.trailerUrl}
                title={`Trailer de ${movie.title}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="cf-empty">
              <Play size={26} />
              <h2>Trailer ainda não disponível</h2>
              <p>Este filme faz parte do catálogo demonstrativo.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
