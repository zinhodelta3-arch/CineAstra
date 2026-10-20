"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { DEMO_ORDERS, DEMO_REFERENCE_DATE, PAGE_SIZE, STATUS, date, filterOrders, money, month, nextSession, orderSummary, time } from "./purchase-data";
import "./purchases.css";

export function PurchaseIcon({ name, ...props }) {
  const shapes = {
    film: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18M17 3v18M3 8h4m-4 8h4M17 8h4m-4 8h4" /></>,
    ticket: <path d="M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7Zm12-1v2m0 3v2m0 3v2" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    down: <path d="m6 9 6 6 6-6" />,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18M7 15h3m4 0h3" /></>,
    location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    play: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="m10 8 5 3-5 3ZM8 21h8" /></>,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h3" /></>,
    archive: <><rect x="3" y="3" width="18" height="5" rx="1" /><path d="M5 8v13h14V8M9 12h6" /></>,
    star: <path d="m12 2 2.6 6.9L22 9.3l-5.8 4.8 1.9 7.2L12 17.2l-6.1 4.1 1.9-7.2L2 9.3l7.4-.4Z" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name] || shapes.film}</svg>;
}

function Poster({ order, large = false }) {
  return <div className={`cp-poster ${large ? "cp-poster-large" : ""}`}><img src={order.image} alt="" loading={large ? "eager" : "lazy"} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/compras/posters/essencial.svg"; }} /><div className="cp-poster-shade" /><span className="cp-poster-title">{order.type === "streaming" && order.title === "CineAstra Essencial" ? "ESSENCIAL" : order.title}</span><span className="cp-poster-brand">CINEASTRA</span></div>;
}
function StatusBadge({ status }) {
  const current = STATUS[status];
  return <span className={`cp-status cp-status-${status}`}><span />{current.label}</span>;
}
function Perforation({ className = "" }) { return <span className={`cp-perforation ${className}`} aria-hidden="true" />; }
function Barcode() { return <span className="cp-barcode" aria-hidden="true">{[1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1].map((w, i) => <i key={i} style={{ width: w, height: `${70 + i * 13 % 31}%` }} />)}</span>; }

function UpcomingTicket({ order, onOpen }) {
  return <section className="cp-upcoming" aria-labelledby="cp-upcoming-title">
    <div className="cp-upcoming-label"><span className="cp-live-dot" /><span>SUA PRÓXIMA SESSÃO</span><span className="cp-upcoming-note">Pode preparar a pipoca.</span></div>
    <div className="cp-ticket">
      <Poster order={order} large />
      <div className="cp-ticket-main"><div className="cp-ticket-meta"><span className="cp-type"><PurchaseIcon name="ticket" />CINEMA</span><StatusBadge status={order.status} /></div><h2 id="cp-upcoming-title">{order.title}</h2><p className="cp-ticket-format">{order.subtitle}</p><div className="cp-session-info"><span><PurchaseIcon name="calendar" /><strong>{date(order.sessionAt, { day: "2-digit", month: "long", year: undefined })}</strong> às {time(order.sessionAt)}</span><span><PurchaseIcon name="location" />{order.venue}</span></div><span className="cp-seat-line">{order.room}<i />Assentos <strong>{order.seats.join(" · ")}</strong></span></div>
      <div className="cp-ticket-stub"><span className="cp-stub-label">O SEU LUGAR JÁ ESTÁ RESERVADO</span><div><span className="cp-stub-seats">{order.seats.length.toString().padStart(2, "0")}</span><span className="cp-stub-tickets">INGRESSOS</span></div><Button className="cp-btn cp-btn-primary" onClick={(e) => onOpen(order, e.currentTarget, "tickets")}><PurchaseIcon name="ticket" />Ver ingressos<PurchaseIcon name="arrow" /></Button><span className="cp-code">{order.id}</span></div>
    </div>
  </section>;
}

function OrderRow({ order, onOpen }) {
  return <article className="cp-order">
    <Poster order={order} />
    <div className="cp-order-main"><div className="cp-order-top"><span className="cp-type"><PurchaseIcon name={order.type === "cinema" ? "ticket" : "play"} />{order.type === "cinema" ? "CINEMA" : "STREAMING"}</span><span className="cp-code">{order.id}</span></div><h3>{order.title}</h3><p>{order.subtitle}</p><span className="cp-order-date">Comprado em {date(order.purchasedAt, { year: undefined })} · {time(order.purchasedAt)}</span></div>
    <div className="cp-order-status"><StatusBadge status={order.status} />{order.status === "canceled" && <span className="cp-refund-note">Valor estornado</span>}</div>
    <div className="cp-order-total"><span>{order.status === "canceled" ? "Total estornado" : "Total pago"}</span><strong>{money(order.total)}</strong></div>
    <Button variant="ghost" className="cp-btn cp-btn-details" aria-label={`Ver detalhes do pedido ${order.id}`} onClick={(e) => onOpen(order, e.currentTarget)}><span>Detalhes</span><PurchaseIcon name="arrow" /></Button>
  </article>;
}

function OrderDetails({ selection, onClose, focusRef, onDownload, onCopy, demo }) {
  const { order, view } = selection;
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Backdrop className="cp-backdrop" /><Dialog.Popup className="cp-root cp-dialog" finalFocus={focusRef}>
    <Perforation /><div className="cp-dialog-header"><span className="cp-eyebrow"><PurchaseIcon name="archive" />{view === "tickets" ? "SEUS INGRESSOS" : "DETALHES DO PEDIDO"}</span><Dialog.Close className="cp-icon-button" aria-label="Fechar detalhes"><PurchaseIcon name="close" /></Dialog.Close></div>
    <Dialog.Title className="cp-dialog-title">{order.title}</Dialog.Title><Dialog.Description className="cp-dialog-description">Pedido {order.id} · {date(order.purchasedAt)} às {time(order.purchasedAt)}</Dialog.Description>
    <div className="cp-detail-meta"><StatusBadge status={order.status} /><button className="cp-copy-button" onClick={() => onCopy(order.id)}><PurchaseIcon name="copy" />Copiar código</button></div>
    {order.sessionAt && <section className="cp-detail-session" aria-label="Informações da sessão"><div><span>Sessão</span><strong>{date(order.sessionAt)} · {time(order.sessionAt)}</strong></div><div><span>Cinema</span><strong>{order.venue}</strong></div><div><span>Sala e formato</span><strong>{order.room} · {order.subtitle}</strong></div><div><span>Assentos</span><strong>{order.seats.join(" · ")}</strong></div></section>}
    {view === "tickets" && order.status === "confirmed" && <section className="cp-ticket-list" aria-label="Ingressos do pedido">{order.seats.map((seat, index) => <div className="cp-mini-ticket" key={seat}><div><span>INGRESSO {String(index + 1).padStart(2, "0")}</span><strong>{seat}</strong><small>ASSENTO</small></div><div><PurchaseIcon name="ticket" /><span>{demo ? "Exemplo visual de ingresso" : "Ingresso do pedido"}</span><code>{order.id} / {seat}</code></div></div>)}</section>}
    {order.access && <p className="cp-access-note"><PurchaseIcon name="play" />{order.access}</p>}
    {order.refund && <p className="cp-refund-box"><PurchaseIcon name="check" />{order.refund}</p>}
    <div className="cp-detail-grid"><section className="cp-detail-items" aria-labelledby="cp-items-title"><h3 id="cp-items-title">Resumo da compra</h3>{order.items.map((item, index) => <div className="cp-item-line" key={index}><span><b>{item.quantity}×</b>{item.label}</span><strong>{money(item.quantity * item.unitPrice)}</strong></div>)}<div className="cp-totals"><div><span>Subtotal</span><span>{money(subtotal)}</span></div><div><span>Taxa de serviço</span><span>{money(order.fee)}</span></div>{order.discount > 0 && <div className="cp-discount"><span>{order.discountLabel || "Desconto"}</span><span>− {money(order.discount)}</span></div>}<div className="cp-final-total"><span>{order.status === "canceled" ? "Total estornado" : "Total pago"}</span><strong>{money(order.total)}</strong></div></div></section>
    <section className="cp-payment" aria-labelledby="cp-payment-title"><h3 id="cp-payment-title">Pagamento</h3><PurchaseIcon name="card" /><strong>{order.payment}</strong><span>{order.paymentDetail}</span><p>{order.status === "canceled" ? "Pedido cancelado e valor devolvido." : "Pagamento aprovado."}</p></section></div>
    <section className="cp-timeline" aria-label="Histórico do pedido">{order.timeline.map((item, i) => <div key={i}><span className="cp-timeline-dot" /><strong>{item.title}</strong><span>{date(item.at, { year: undefined })} · {time(item.at)}</span></div>)}</section>
    <div className="cp-dialog-footer"><span className="cp-summary-note">Resumo do pedido, sem valor fiscal.</span><Button className="cp-btn cp-btn-primary" onClick={() => onDownload(order)}><PurchaseIcon name="download" />Baixar resumo</Button></div>
  </Dialog.Popup></Dialog.Portal></Dialog.Root>;
}

export default function PurchaseHistory({ orders = DEMO_ORDERS, referenceDate = DEMO_REFERENCE_DATE, demo = true }) {
  const [filters, setFilters] = useState({ type: "all", status: "all", period: "all", query: "" });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selection, setSelection] = useState(null);
  const [notice, setNotice] = useState("");
  const returnFocus = useRef(null);
  const matching = useMemo(() => filterOrders(orders, filters, referenceDate), [orders, filters, referenceDate]);
  const upcoming = useMemo(() => nextSession(orders, referenceDate), [orders, referenceDate]);
  const shown = matching.slice(0, visible);
  const groups = new Map();
  for (const order of shown) { const label = month(order.purchasedAt); if (!groups.has(label)) groups.set(label, []); groups.get(label).push(order); }
  const isFiltered = filters.type !== "all" || filters.status !== "all" || filters.period !== "all" || filters.query.trim() !== "";
  const change = (field, value) => { setFilters((old) => ({ ...old, [field]: value })); setVisible(PAGE_SIZE); };
  const clear = () => { setFilters({ type: "all", status: "all", period: "all", query: "" }); setVisible(PAGE_SIZE); };
  const open = (order, element, view = "details") => { returnFocus.current = element; setSelection({ order, view }); };
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 5000); return () => clearTimeout(timer); }, [notice]);
  const copy = async (id) => {
    try { await navigator.clipboard.writeText(id); setNotice("Código do pedido copiado."); }
    catch { setNotice(`Não foi possível copiar. O código do pedido é ${id}.`); }
  };
  const download = (order) => {
    try {
      const blob = new Blob(["\uFEFF", orderSummary(order)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `CineAstra-${order.id}.txt`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice("O download do resumo foi iniciado.");
    } catch { setNotice("Não foi possível baixar o resumo. Tente novamente."); }
  };
  return <main className="cp-root cp-page"><div className="cp-grain" aria-hidden="true" /><div className="cp-container">
    <nav className="cp-breadcrumb" aria-label="Você está em"><span>Minha conta</span><PurchaseIcon name="chevron" /><span aria-current="page">Minhas compras</span></nav>
    <header className="cp-page-heading"><div><p className="cp-eyebrow"><PurchaseIcon name="film" />O SEU ARQUIVO DE BOAS HISTÓRIAS</p><h1>Minhas <em>compras.</em></h1><p className="cp-page-description">Os filmes passam. As boas histórias ficam por aqui.</p></div><div className="cp-archive-count"><span className="cp-archive-number">{String(orders.length).padStart(2, "0")}</span><div><span>PEDIDOS NO</span><strong>seu arquivo</strong>{demo && <small>Dados de demonstração</small>}</div></div></header>
    {upcoming && <UpcomingTicket order={upcoming} onOpen={open} />}
    <section className="cp-history" aria-labelledby="cp-history-heading"><div className="cp-history-heading"><h2 id="cp-history-heading"><PurchaseIcon name="archive" />Histórico de pedidos</h2><span>{orders.length} {orders.length === 1 ? "história registrada" : "histórias registradas"}</span></div>
      <div className="cp-filter-bar"><div className="cp-type-filters" role="group" aria-label="Tipo de compra">{[{ id: "all", label: "Tudo", icon: "archive" }, { id: "cinema", label: "Cinema", icon: "ticket" }, { id: "streaming", label: "Streaming", icon: "play" }].map((tab) => <button className={`cp-tab ${filters.type === tab.id ? "is-active" : ""}`} key={tab.id} aria-pressed={filters.type === tab.id} onClick={() => change("type", tab.id)}><PurchaseIcon name={tab.icon} />{tab.label}<span>{orders.filter((o) => tab.id === "all" || o.type === tab.id).length}</span></button>)}</div><div className="cp-search"><PurchaseIcon name="search" /><input value={filters.query} onChange={(e) => change("query", e.target.value)} placeholder="Busque por título ou pedido" aria-label="Buscar compras por título ou pedido" />{filters.query && <button aria-label="Limpar busca" onClick={() => change("query", "")}><PurchaseIcon name="close" /></button>}</div></div>
      <div className="cp-filter-options"><div><label className="cp-select-wrap"><span>Período</span><select aria-label="Filtrar por período" value={filters.period} onChange={(e) => change("period", e.target.value)}><option value="all">Todo o período</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select><PurchaseIcon name="down" /></label><label className="cp-select-wrap"><span>Situação</span><select aria-label="Filtrar por situação" value={filters.status} onChange={(e) => change("status", e.target.value)}><option value="all">Todas as situações</option><option value="confirmed">Confirmado</option><option value="completed">Concluído</option><option value="canceled">Cancelado</option></select><PurchaseIcon name="down" /></label></div><div className="cp-results" role="status" aria-live="polite"><span>{matching.length} {matching.length === 1 ? "pedido encontrado" : "pedidos encontrados"}</span>{isFiltered && <button onClick={clear}>Limpar filtros<PurchaseIcon name="close" /></button>}</div></div>
      <div className="cp-order-list">{Array.from(groups.entries()).map(([label, group]) => <section key={label} className="cp-month-group" aria-label={label}><div className="cp-month-heading"><h3>{label}</h3><span /><PurchaseIcon name="film" /></div>{group.map((order) => <OrderRow key={order.id} order={order} onOpen={open} />)}</section>)}{matching.length === 0 && <div className="cp-empty"><PurchaseIcon name={orders.length ? "search" : "ticket"} /><h3>{orders.length ? "Nenhuma história por esse filtro." : "Sua primeira história começa em breve."}</h3><p>{orders.length ? "Tente outro título, código ou período para encontrar sua compra." : "Quando você fizer uma compra no CineAstra, os detalhes aparecerão aqui."}</p>{isFiltered && <Button className="cp-btn cp-btn-outline" variant="outline" onClick={clear}>Limpar filtros</Button>}</div>}</div>
      {matching.length > 0 && <div className="cp-pagination"><span>Exibindo {shown.length} de {matching.length} pedidos</span>{visible < matching.length ? <Button className="cp-btn cp-btn-outline" variant="outline" onClick={() => setVisible((n) => n + PAGE_SIZE)}>Carregar mais pedidos<PurchaseIcon name="down" /></Button> : <span className="cp-end-history"><PurchaseIcon name="check" />Você chegou ao início dessa história.</span>}</div>}
    </section>
    <footer className="cp-page-footer"><span>CINEASTRA <b>✦</b> ALÉM DA TELA</span><Perforation /><span>SEU ARQUIVO. SUAS HISTÓRIAS.</span></footer>
  </div>{selection && <OrderDetails selection={selection} onClose={() => setSelection(null)} focusRef={returnFocus} onDownload={download} onCopy={copy} demo={demo} />}<div className={`cp-toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite">{notice && <><PurchaseIcon name="check" /><span>{notice}</span><button className="cp-icon-button" aria-label="Fechar aviso" onClick={() => setNotice("")}><PurchaseIcon name="close" /></button></>}</div></main>;
}
