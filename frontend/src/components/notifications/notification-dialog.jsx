"use client";

import { useEffect, useId, useRef } from "react";
import { Ticket, MessageCircle, X, Check } from "lucide-react";
import styles from "./notifications.module.css";

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default function NotificationDialog({ item, onClose }) {
  const dialogRef = useRef(null);
  const id = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <div className={styles.filmstrip} aria-hidden="true" />
    <div className={styles.dialogBody}>
      <div className={styles.dialogTop}><span className={styles.eyebrow}>{item.type === "ticket" ? <Ticket size={16} aria-hidden="true" /> : <MessageCircle size={16} aria-hidden="true" />}{item.label}</span><button autoFocus type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar detalhes"><X size={20} /></button></div>
      <h2 id={`${id}-title`} className={styles.display}>{item.subject}</h2>
      <time dateTime={item.createdAt} className={styles.dialogTime}>{fullDateFormatter.format(new Date(item.createdAt))}</time>
      <p id={`${id}-description`} className={styles.dialogDescription}>{item.details}</p>
      <dl className={styles.detailGrid}>{item.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
      <div className={styles.dialogFooter}><span>AVISO CINEASTRA</span><button type="button" className={styles.primaryButton} onClick={onClose}>Entendido <Check size={16} aria-hidden="true" /></button></div>
    </div>
  </dialog>;
}

