"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Ticket, Film, MapPin, Armchair, Plus, Minus, Check, Info, CalendarDays, Clock3, ChevronDown, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TICKET_TYPES, brl, emptySelection, quantityOf, totalOf, updateQuantity, createOrder } from "./ticket-state.mjs";
import "./ticket-selection.css";

function FilmRibbon() {
  return (
    <svg className="ca-film-ribbon" viewBox="0 0 1100 1000" fill="none" aria-hidden="true">
      <path d="M1150 40C720-80 320 170 180 350S355 670 760 500 1180 650 740 850 130 1050-80 900" stroke="currentColor" strokeWidth="158" />
      <path d="M1150 40C720-80 320 170 180 350S355 670 760 500 1180 650 740 850 130 1050-80 900" stroke="var(--background)" strokeWidth="116" />
      <path d="M1150 40C720-80 320 170 180 350S355 670 760 500 1180 650 740 850 130 1050-80 900" stroke="currentColor" strokeWidth="150" strokeDasharray="12 64" />
      <path d="M1150 40C720-80 320 170 180 350S355 670 760 500 1180 650 740 850 130 1050-80 900" stroke="var(--background)" strokeWidth="146" strokeDasharray="18 20" />
    </svg>
  );
}

function Barcode() {
  return <div className="ca-barcode" aria-hidden="true">{Array.from({ length: 43 }, (_, index) => <i key={index} style={{ width: `${1 + (index * 7) % 3}px`, height: `${70 + (index * 11) % 30}%` }} />)}</div>;
}

function TicketCard({ type, count, selectedCount, seatCount, onChange, onInfo, large = false }) {
  const selected = count > 0;
  const remaining = seatCount - selectedCount;
  return (
    <article className={`ca-ticket${large ? " ca-ticket-large" : ""}${selected ? " is-selected" : ""}`} aria-label={type.name}>
      <div className="ca-ticket-inner">
        <div className="ca-ticket-main">
          <div className="ca-ticket-top"><span className="ca-ticket-type"><Ticket size={16} aria-hidden="true" /> {type.partner ? "PARCERIA CINEASTRA" : "CINEASTRA · CINEMA"}</span><span className="ca-ticket-code">{type.code}</span></div>
          <div className="ca-ticket-name-row"><h3>{type.name}</h3><Button variant="ghost" className="ca-info-button" onClick={() => onInfo(type)} aria-label={`Condições de ${type.name}`}><Info size={17} aria-hidden="true" /></Button></div>
          <p className="ca-ticket-tagline">{type.label}</p>
          <div className="ca-ticket-bottom"><div><span className="ca-price">{brl(type.price)}</span><span className="ca-price-unit">por pessoa</span></div><span className="ca-ticket-mark" aria-hidden="true">{type.partner ? "nu" : <Ticket size={29} strokeWidth={1.3} />}</span></div>
        </div>
        <div className="ca-ticket-stub">
          <span className="ca-stub-caption">QUANTIDADE</span>
          <div className="ca-counter" role="group" aria-label={`Quantidade de ${type.name}`}>
            <Button variant="outline" className="ca-counter-button" disabled={count === 0} onClick={() => onChange(type.id, -1)} aria-label={`Remover uma ${type.name.toLowerCase()}`}><Minus size={17} aria-hidden="true" /></Button>
            <output className="ca-counter-value" aria-label={`${count} ingressos de ${type.name}`}>{String(count).padStart(2, "0")}</output>
            <Button variant="outline" className="ca-counter-button" disabled={remaining <= 0} onClick={() => onChange(type.id, 1)} aria-label={`Adicionar uma ${type.name.toLowerCase()}`}><Plus size={17} aria-hidden="true" /></Button>
          </div>
          <span className="ca-stub-end">{selected ? <><Check size={13} aria-hidden="true" /> No pedido</> : "ADMIT ONE"}</span>
        </div>
      </div>
    </article>
  );
}

export default function TicketSelection({ session, onBack, onContinue }) {
  const [selection, setSelection] = useState(emptySelection);
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const count = quantityOf(selection);
  const total = totalOf(selection);
  const seatCount = session.seats.length;
  const remaining = seatCount - count;
  const complete = remaining === 0;
  const selected = TICKET_TYPES.filter(({ id }) => selection[id] > 0);

  function change(id, delta) {
    setMessage("");
    setSelection((current) => updateQuantity(current, id, delta, seatCount));
  }

  async function continueOrder() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      await onContinue(createOrder(session, selection));
    } catch (error) {
      setMessage(error?.message || "Não foi possível continuar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ca-checkout min-h-screen bg-background text-foreground">
      <div className="ca-perf ca-perf-top" aria-hidden="true" />
      <div className="ca-checkout-shell">
        <div className="ca-checkout-topbar">
          <Button variant="ghost" className="ca-back" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" /> Voltar aos assentos</Button>
          <nav aria-label="Etapas da compra"><ol className="ca-steps"><li className="is-done"><span><Check size={13} aria-hidden="true" /></span>Assentos</li><li className="is-current" aria-current="step"><span>02</span>Ingressos</li><li><span>03</span>Pagamento</li></ol></nav>
        </div>

        <div className="ca-checkout-grid">
          <main className="ca-ticket-stage" id="escolher-ingressos">
            <FilmRibbon />
            <div className="ca-ticket-stage-content">
              <header className="ca-stage-heading"><p className="ca-eyebrow"><span className="ca-scene-number">CENA 02</span> O PRÓXIMO PASSO DA SUA HISTÓRIA</p><h1>ESCOLHA SEUS<br /><span>INGRESSOS</span><span className="ca-period">.</span></h1><p>O lugar já é seu. Escolha como entrar nessa história.</p></header>
              <div className={`ca-progress${complete ? " is-complete" : ""}`}><span className="ca-progress-icon">{complete ? <Check size={17} aria-hidden="true" /> : <Armchair size={18} aria-hidden="true" />}</span><div><strong>{complete ? "Tudo certo para a sua sessão" : `Um ingresso para cada assento`}</strong><p>{complete ? "Você já pode continuar com a compra." : `Escolha ${seatCount} ${seatCount === 1 ? "ingresso" : "ingressos"}. Pode combinar tipos diferentes.`}</p></div><span className="ca-progress-count">{String(count).padStart(2, "0")}<i>/ {String(seatCount).padStart(2, "0")}</i></span></div>
              <section className="ca-ticket-group" aria-labelledby="ca-regular-heading"><div className="ca-group-heading"><h2 id="ca-regular-heading">Inteira</h2><span>O INGRESSO CLÁSSICO</span><div aria-hidden="true" /></div><TicketCard type={TICKET_TYPES[0]} count={selection.inteira} selectedCount={count} seatCount={seatCount} onChange={change} onInfo={setInfo} large /></section>
              <section className="ca-ticket-group ca-half-group" aria-labelledby="ca-half-heading"><div className="ca-group-heading"><h2 id="ca-half-heading">Meia entrada</h2><span>BENEFÍCIOS QUE ABREM A CENA</span><div aria-hidden="true" /></div><div className="ca-half-grid">{TICKET_TYPES.slice(1).map((type) => <TicketCard key={type.id} type={type} count={selection[type.id]} selectedCount={count} seatCount={seatCount} onChange={change} onInfo={setInfo} />)}</div></section>
              <details className="ca-benefit-details"><summary><span><Info size={17} aria-hidden="true" /> Vai de meia entrada ou benefício?</span><ChevronDown size={17} className="ca-details-chevron" aria-hidden="true" /></summary><div><p>Leve um documento válido que comprove seu benefício e apresente-o na entrada do cinema. No caso de parceria, confira também a elegibilidade e as formas de pagamento aceitas.</p><p>Use o ícone de informação em cada ingresso para consultar suas condições.</p></div></details>
              <footer className="ca-stage-footer"><span className="ca-stage-wordmark">CINE<span>ASTRA</span><i>✦</i></span><span>APAGAM-SE AS LUZES. COMEÇAM AS HISTÓRIAS.</span></footer>
            </div>
          </main>

          <aside className="ca-summary" aria-labelledby="ca-summary-title">
            <div className="ca-summary-content">
              <div className="ca-summary-heading"><span className="ca-eyebrow"><Ticket size={15} aria-hidden="true" /> SUA PRÓXIMA SESSÃO</span><h2 id="ca-summary-title">Resumo da compra<span className="ca-period">.</span></h2></div>
              <section className="ca-summary-movie" aria-label="Filme escolhido">
                <div className="ca-movie-poster">{session.movie.poster && !imageFailed ? <img src={session.movie.poster} alt={`Imagem de ${session.movie.title}`} onError={() => setImageFailed(true)} /> : <Film size={35} aria-hidden="true" />}<span className="ca-poster-caption" aria-hidden="true">CINE<br />ASTRA</span></div>
                <div><span className="ca-small-label">O FILME</span><h3>{session.movie.title}</h3><p>{session.movie.genre}</p><div className="ca-film-meta"><span className="ca-age" aria-label={`Classificação: ${session.movie.rating} anos`}>{session.movie.rating}</span><span>{session.format}</span><span>{session.language}</span></div></div>
              </section>
              <section className="ca-summary-section" aria-labelledby="ca-session-title"><h3 id="ca-session-title"><MapPin size={16} aria-hidden="true" /> Cinema e sessão</h3><p className="ca-cinema-name">{session.cinema.name}</p><p>{session.cinema.room} <span aria-hidden="true">·</span> {session.format} <span aria-hidden="true">·</span> {session.language}</p><div className="ca-session-date"><span><CalendarDays size={14} aria-hidden="true" /> {session.dateLabel}</span><span><Clock3 size={14} aria-hidden="true" /> {session.time}</span></div></section>
              <section className="ca-summary-section" aria-labelledby="ca-seats-title"><div className="ca-section-line"><h3 id="ca-seats-title"><Armchair size={16} aria-hidden="true" /> Seus assentos</h3><span className="ca-small-label">{seatCount} {seatCount === 1 ? "LUGAR" : "LUGARES"}</span></div><div className="ca-seat-tags">{session.seats.map((seat) => <span key={seat}><Armchair size={15} aria-hidden="true" /> {seat}</span>)}</div></section>
              <section className="ca-summary-section ca-summary-tickets" aria-labelledby="ca-tickets-title"><div className="ca-section-line"><h3 id="ca-tickets-title"><Ticket size={16} aria-hidden="true" /> Ingressos</h3><span className="ca-summary-count">{count}/{seatCount}</span></div>{selected.length ? <ul>{selected.map((type) => <li key={type.id}><span><b>{selection[type.id]}×</b> {type.name}</span><strong>{brl(selection[type.id] * type.price)}</strong></li>)}</ul> : <p className="ca-empty-summary">Sua sessão já tem lugar.<br />Agora só falta escolher a entrada.</p>}<p className="ca-selection-status" role="status">{complete ? <><Check size={14} aria-hidden="true" /> Todos os assentos têm ingresso.</> : <>Falta{remaining === 1 ? "" : "m"} {remaining} ingresso{remaining === 1 ? "" : "s"} para completar.</>}</p></section>
            </div>
            <div className="ca-summary-footer"><div className="ca-total-line"><div><span className="ca-small-label">TOTAL DOS INGRESSOS</span><span className="ca-summary-total">{brl(total)}</span></div><Ticket size={29} strokeWidth={1.3} aria-hidden="true" /></div><p className="ca-total-note">{count} de {seatCount} ingressos selecionados</p><Button className="ca-continue" disabled={!complete || submitting} onClick={continueOrder}>{submitting ? "Continuando…" : "Continuar"}<ArrowRight size={18} aria-hidden="true" /></Button>{message && <p className="ca-error" role="alert">{message}</p>}<div className="ca-summary-stub"><Barcode /><span>UM LUGAR.<br />MIL HISTÓRIAS.</span></div></div>
          </aside>
        </div>
      </div>
      <Dialog open={Boolean(info)} onOpenChange={(open) => { if (!open) setInfo(null); }}><DialogContent className="ca-checkout-modal"><DialogHeader><span className="ca-eyebrow"><CreditCard size={16} aria-hidden="true" /> ANTES DE ESCOLHER</span><DialogTitle>{info?.name}</DialogTitle><DialogDescription>{info?.description}</DialogDescription></DialogHeader><div className="ca-modal-price">{info && brl(info.price)} <span>por pessoa</span></div><Button className="ca-modal-dismiss" onClick={() => setInfo(null)}>Entendi <Check size={16} aria-hidden="true" /></Button></DialogContent></Dialog>
    </div>
  );
}
