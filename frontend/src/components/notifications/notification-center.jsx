"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, BellOff, Check, CheckCheck, Clapperboard, Film, MessageCircle, Ticket, Trash2, Undo2, X } from "lucide-react";
import { useNotifications } from "./notification-store";
import styles from "./notifications.module.css";
import NotificationDialog from "./notification-dialog";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });

function Barcode() {
  return <div className={styles.barcode} aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ width: (i * 7) % 3 + 1, height: `${65 + (i * 13) % 35}%` }} />)}</div>;
}

function Filmstrip() {
  return <div className={styles.filmstrip} aria-hidden="true" />;
}

function ClapWatermark() {
  return <div className={styles.watermark} aria-hidden="true">
    <svg viewBox="0 0 640 560" fill="none"><defs><pattern id="ca-notification-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="currentColor" /></pattern></defs>
      <g fill="url(#ca-notification-dots)"><rect x="60" y="170" width="540" height="330" rx="22" /><path d="M60 162 32 87Q28 75 42 69L531 3Q546 0 550 14L577 90Z" /></g>
      <path d="M107 68 156 135M218 53 265 119M327 37 375 105M437 22 486 89M100 250H553M100 338H553M300 250V438" stroke="var(--background)" strokeWidth="20" />
    </svg>
  </div>;
}

function NotificationCard({ item, onOpen, onToggle, onRemove }) {
  const Icon = item.type === "support" ? MessageCircle : Ticket;
  return <article className={`${styles.notification} ${!item.read ? styles.unread : ""}`} aria-label={`${item.label}: ${item.subject}${!item.read ? ", não lida" : ""}`}>
    <div className={styles.iconStub}><Icon size={23} strokeWidth={1.5} aria-hidden="true" /><span>{item.type === "ticket" ? "TICKET" : "CONTATO"}</span></div>
    <div className={styles.cardBody}>
      <div className={styles.cardMeta}><span>{item.label}</span><span className={styles.dot} aria-hidden="true" /><time dateTime={item.createdAt} title={fullDateFormatter.format(new Date(item.createdAt))}>{dateFormatter.format(new Date(item.createdAt))}</time>{!item.read && <span className={styles.newBadge}>Nova</span>}</div>
      <h3>{item.title}</h3><p>{item.description}</p>
      <div className={styles.cardActions}>
        <button type="button" className={styles.detailsButton} onClick={() => onOpen(item)}>Ver detalhes <ArrowRight size={15} aria-hidden="true" /></button>
        <div className={styles.secondaryActions}>
          <button type="button" onClick={() => onToggle(item)} aria-label={`Marcar ${item.subject} como ${item.read ? "não lida" : "lida"}`} title={item.read ? "Marcar como não lida" : "Marcar como lida"}>{item.read ? <Bell size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}<span>{item.read ? "Marcar não lida" : "Marcar como lida"}</span></button>
          <button type="button" onClick={() => onRemove(item)} aria-label={`Excluir notificação: ${item.subject}`} title="Excluir notificação"><Trash2 size={15} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  </article>;
}

export default function NotificationCenter() {
  const { items, ready, persistent, unreadCount, markRead, markAllRead, remove, restore } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [removed, setRemoved] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const headingRef = useRef(null);
  const returnFocusRef = useRef(null);
  const sorted = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const unread = sorted.filter((item) => !item.read);
  const read = sorted.filter((item) => item.read);

  function openDetails(item) {
    returnFocusRef.current = document.activeElement;
    setSelected(item);
    if (!item.read) { markRead(item.id); setAnnouncement("Notificação marcada como lida."); }
  }
  function closeDetails() {
    setSelected(null);
    requestAnimationFrame(() => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
      else headingRef.current?.focus();
    });
  }
  function toggleRead(item) {
    markRead(item.id, !item.read);
    setAnnouncement(item.read ? "Notificação marcada como não lida." : "Notificação marcada como lida.");
    headingRef.current?.focus();
  }
  function deleteItem(item) {
    setRemoved(item); remove(item.id); setAnnouncement("Notificação excluída. Você pode desfazer a última exclusão.");
    headingRef.current?.focus();
  }
  function renderGroup(title, entries, isNew) {
    if (!entries.length) return null;
    return <section className={styles.group} aria-label={title}>
      <div className={styles.groupHeading}><h2>{isNew && <span className={styles.unreadDot} aria-hidden="true" />}{title}<span className={styles.groupCount}>{entries.length.toString().padStart(2, "0")}</span></h2><span className={styles.groupLine} /></div>
      <div className={styles.cards}>{entries.map((item) => <NotificationCard key={item.id} item={item} onOpen={openDetails} onToggle={toggleRead} onRemove={deleteItem} />)}</div>
    </section>;
  }

  const emptyFilter = (filter === "unread" && !unread.length) || (filter === "read" && !read.length);
  return <main className={styles.root}>
    <Filmstrip />
    <div className={styles.stage}>
      <ClapWatermark />
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Caminho da página"><Link href="/"><ArrowLeft size={14} aria-hidden="true" />Início</Link><span aria-hidden="true">/</span><span aria-current="page">Notificações</span></nav>
        <header className={styles.pageHeader}>
          <div><p className={styles.eyebrow}><Film size={16} aria-hidden="true" /> SUA CONEXÃO COM A PRÓXIMA CENA</p><h1 className={styles.display} ref={headingRef} tabIndex={-1}>Notificações<span className={styles.titleDot}>.</span></h1><p className={styles.intro}>Dos ingressos às nossas conversas. Tudo passa por aqui.</p></div>
          <div className={styles.edition} aria-hidden="true"><span>CINEASTRA</span><strong>CA / 03</strong><span>CENTRAL DE ATIVIDADES</span></div>
        </header>

        <div className={styles.contentGrid}>
          <div className={styles.feed}>
            <div className={styles.toolbar}>
              <div className={styles.filters} role="group" aria-label="Filtrar notificações">{[{ id: "all", label: "Todas", count: items.length }, { id: "unread", label: "Não lidas", count: unreadCount }, { id: "read", label: "Lidas", count: read.length }].map((tab) => <button type="button" key={tab.id} onClick={() => setFilter(tab.id)} aria-pressed={filter === tab.id} className={filter === tab.id ? styles.activeFilter : ""}>{tab.label}<span>{ready ? tab.count : "–"}</span></button>)}</div>
              <button type="button" className={styles.markAll} disabled={!ready || !unreadCount} onClick={() => { markAllRead(); setAnnouncement("Todas as notificações foram marcadas como lidas."); }}><CheckCheck size={17} aria-hidden="true" /><span>Marcar todas como lidas</span></button>
            </div>
            {!persistent && <p className={styles.storageNotice} role="status">As alterações funcionam nesta visita, mas não foi possível salvá-las neste navegador.</p>}
            {!ready ? <div className={styles.loading} role="status">Carregando suas notificações…</div> : items.length === 0 || emptyFilter ? <section className={styles.empty}>
              <div className={styles.emptyIcon}><BellOff size={35} strokeWidth={1.2} aria-hidden="true" /></div>
              <p className={styles.eyebrow}>{items.length === 0 ? "UM INTERVALO ENTRE AS CENAS" : "TUDO EM ORDEM POR AQUI"}</p>
              <h2 className={styles.display}>{items.length === 0 ? <>Você não tem<br />notificações.</> : filter === "unread" ? <>Nenhuma novidade<br />ficou para trás.</> : <>Ainda não há<br />atividades lidas.</>}</h2>
              <p>{items.length === 0 ? "Quando uma nova história chegar, a gente avisa por aqui." : filter === "unread" ? "Você já conferiu todos os seus avisos." : "As notificações que você abrir vão aparecer aqui."}</p>
              {emptyFilter && items.length > 0 ? <button type="button" className={styles.outlineButton} onClick={() => setFilter("all")}>Ver todas <ArrowRight size={16} aria-hidden="true" /></button> : <Link className={styles.outlineButton} href="/">Voltar ao início <ArrowRight size={16} aria-hidden="true" /></Link>}
            </section> : <>{filter !== "read" && renderGroup("Novas atividades", unread, true)}{filter !== "unread" && renderGroup("Atividades lidas", read, false)}</>}
            {removed && <div className={styles.undoBar}><span>Notificação excluída.</span><button type="button" onClick={() => { restore(removed); setRemoved(null); setAnnouncement("Notificação restaurada."); }}><Undo2 size={15} aria-hidden="true" />Desfazer</button><button type="button" onClick={() => setRemoved(null)} aria-label="Dispensar opção de desfazer"><X size={16} /></button></div>}
          </div>

          <aside className={styles.sidebar} aria-label="Resumo das notificações">
            <div className={styles.summaryTicket}>
              <div className={styles.ticketTop}><Clapperboard size={24} strokeWidth={1.4} aria-hidden="true" /><span>SEU CINEMA, EM DIA.</span></div>
              <div className={styles.ticketMiddle}><span className={styles.summaryNumber}>{ready ? unreadCount.toString().padStart(2, "0") : "–"}</span><p>{unreadCount === 1 ? "nova atividade\npara conferir" : "novas atividades\npara conferir"}</p></div>
              <div className={styles.ticketTear} aria-hidden="true" />
              <div className={styles.ticketBottom}><p>{unreadCount ? "Tem novidade esperando por você. Sua próxima cena começa aqui." : "Tudo em dia. Agora é só aproveitar a próxima cena."}</p><Barcode /><span>ACESSO PESSOAL · CINEASTRA</span></div>
            </div>
            <p className={styles.sidebarNote}><Bell size={15} aria-hidden="true" />Compras e respostas do suporte reunidas em um só lugar.</p>
          </aside>
        </div>
        <footer className={styles.pageFooter}><span>CINEASTRA · CADA HISTÓRIA IMPORTA</span><span>FIM DO ROLO <span aria-hidden="true">✦</span></span></footer>
      </div>
    </div>
    <Filmstrip />
    <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    {selected && <NotificationDialog item={selected} onClose={closeDetails} />}
  </main>;
}
