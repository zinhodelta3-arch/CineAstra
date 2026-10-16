"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Bell, BellOff, MessageCircle, Ticket, X } from "lucide-react";
import { useNotifications } from "./notification-store";
import NotificationDialog from "./notification-dialog";
import styles from "./notification-dropdown.module.css";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "short", timeZone: "America/Sao_Paulo",
});

export function NotificationButton() {
  const { items, unreadCount, ready, markRead } = useNotifications();
  const pathname = usePathname();
  const active = pathname === "/notificacoes";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 430, maxHeight: 560 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();
  const recent = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3);
  const label = ready && unreadCount ? `Notificações: ${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}` : "Notificações";

  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }
  useEffect(() => { setOpen(false); }, [pathname]);

  useLayoutEffect(() => {
    if (!open) return;
    function positionPanel(event) {
      if (event?.target instanceof Node && panelRef.current?.contains(event.target)) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const width = Math.min(430, window.innerWidth - 24);
      const top = Math.max(12, Math.min(rect.bottom + 12, window.innerHeight - 160));
      setPosition({ width, top, left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)), maxHeight: Math.max(120, Math.min(600, window.innerHeight - top - 12)) });
    }
    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => { window.removeEventListener("resize", positionPanel); window.removeEventListener("scroll", positionPanel, true); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      (panelRef.current?.querySelector("[data-recent-notification]") || panelRef.current?.querySelector("a"))?.focus({ preventScroll: true });
    });
    function outsideClick(event) {
      if (!panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("pointerdown", outsideClick);
    document.addEventListener("keydown", escape);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("pointerdown", outsideClick); document.removeEventListener("keydown", escape); };
  }, [open]);

  function openDetails(item) { close(); markRead(item.id); setSelected(item); }

  // O portal evita que o backdrop-filter do header corte o dropdown.
  return <>
    <button ref={triggerRef} type="button" aria-label={label} title={label}
      aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup="dialog"
      onClick={() => setOpen((value) => !value)}
      className={`relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${active || open ? "border-primary/40 bg-primary/10 text-primary" : "border-border/70 text-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-primary"}`}>
      <Bell className="size-[19px]" strokeWidth={1.7} aria-hidden="true" />
      {ready && unreadCount > 0 && <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-extrabold leading-none text-primary-foreground ring-2 ring-background">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
    {open && createPortal(
      <section ref={panelRef} id={id} role="dialog" aria-modal="false" aria-labelledby={`${id}-title`} className={styles.panel} style={position}
        onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== triggerRef.current) setOpen(false); }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = [...event.currentTarget.querySelectorAll("button, a[href]")];
          if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); close(true); }
          else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
            const pageControls = [...document.querySelectorAll("a[href], button:not([disabled]), input, select, [tabindex='0']")].filter((el) => !panelRef.current.contains(el) && el.getClientRects().length);
            const next = pageControls[pageControls.indexOf(triggerRef.current) + 1];
            event.preventDefault(); close(); (next || triggerRef.current)?.focus();
          }
        }}>
        <div className={styles.perforation} aria-hidden="true" />
        <header className={styles.heading}>
          <div><p>ÚLTIMAS CENAS</p><h2 id={`${id}-title`}>Notificações <span>{unreadCount}</span></h2></div>
          <button type="button" className={styles.closeButton} onClick={() => close(true)} aria-label="Fechar notificações"><X size={20} aria-hidden="true" /></button>
        </header>
        <div className={styles.feed}>
          {!ready ? <p className={styles.empty}>Carregando notificações…</p> : recent.length ? <ul className={styles.list}>
            {recent.map((item) => {
              const Icon = item.type === "support" ? MessageCircle : Ticket;
              return <li key={item.id}><button type="button" data-recent-notification className={`${styles.item} ${!item.read ? styles.unread : ""}`}
                onClick={() => openDetails(item)} aria-label={`${item.subject}. ${item.label}.${!item.read ? " Não lida." : ""} Ver detalhes.`}>
                <span className={styles.icon}><Icon size={21} strokeWidth={1.5} aria-hidden="true" /></span>
                <span className={styles.itemBody}><span className={styles.meta}>{item.label}{!item.read && <span className={styles.dot} aria-hidden="true" />}</span><strong>{item.subject}</strong><span className={styles.description}>{item.description}</span><time dateTime={item.createdAt}>{dateFormatter.format(new Date(item.createdAt))}</time></span>
              </button></li>;
            })}
          </ul> : <div className={styles.empty}><BellOff size={30} strokeWidth={1.5} aria-hidden="true" /><strong>Nenhuma notificação por aqui.</strong><p>Quando uma novidade chegar, a gente avisa.</p></div>}
        </div>
        <footer className={styles.footer}><Link href="/notificacoes" onClick={() => close(true)} className={styles.viewAll}>Ver todas as notificações <ArrowRight size={18} aria-hidden="true" /></Link></footer>
      </section>, document.body
    )}
    {selected && <NotificationDialog item={selected} onClose={() => { setSelected(null); requestAnimationFrame(() => triggerRef.current?.focus()); }} />}
  </>;
}
