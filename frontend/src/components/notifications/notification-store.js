"use client";

import { useSyncExternalStore } from "react";

// Demonstração local. Em produção, substitua a persistência por sua API autenticada.
export const STORAGE_KEY = "cineastra:notifications:demo:v1";
export const DEMO_NOTIFICATIONS = [
  {
    id: "compra-1048", type: "ticket", title: "Seu próximo encontro com a telona está confirmado.",
    description: "Compra aprovada para O Último Fotograma. Seus lugares já estão reservados.",
    subject: "O Último Fotograma", label: "Compra confirmada", createdAt: "2026-10-15T16:35:00-03:00", read: false,
    details: "Pagamento aprovado. Apresente o ingresso disponível na sua conta na entrada da sessão. Este aviso é apenas um resumo do pedido e não substitui o ingresso.",
    fields: [{ label: "Pedido", value: "CA-1048" }, { label: "Sessão", value: "17 out. 2026 · 20h00" }, { label: "Sala", value: "03 · IMAX 3D" }, { label: "Lugares", value: "F08 e F09" }],
  },
  {
    id: "compra-1032", type: "ticket", title: "Ingressos garantidos. A aventura espera por você.",
    description: "Tudo certo com sua compra para Constelação Kira. Confira os detalhes da sessão.",
    subject: "Constelação Kira", label: "Compra confirmada", createdAt: "2026-10-14T14:10:00-03:00", read: true,
    details: "Sua compra foi confirmada. Confira a data e o horário antes de sair de casa. O ingresso completo fica na área de pedidos da sua conta.",
    fields: [{ label: "Pedido", value: "CA-1032" }, { label: "Sessão", value: "16 out. 2026 · 18h20" }, { label: "Sala", value: "01 · IMAX 4K" }, { label: "Lugares", value: "D10 e D11" }],
  },
  {
    id: "suporte-208", type: "support", title: "Tem uma resposta da nossa equipe para você.",
    description: "Respondemos à sua dúvida sobre meia-entrada. A conversa continua por aqui.",
    subject: "Dúvida sobre meia-entrada", label: "Resposta do suporte", createdAt: "2026-10-13T10:42:00-03:00", read: true,
    details: "Olá! Obrigado por entrar em contato com o CineAstra. Para conferir os documentos aceitos na sua sessão, consulte as informações de meia-entrada no momento da compra. Se ainda tiver dúvidas, nossa equipe pode ajudar pelo canal de atendimento.",
    fields: [{ label: "Protocolo", value: "AT-0208" }, { label: "Assunto", value: "Meia-entrada" }],
  },
];

const serverSnapshot = { items: [], ready: false, persistent: true };
let snapshot = serverSnapshot;
let initialized = false;
const listeners = new Set();

function isNotification(item) {
  return item && typeof item.id === "string" && ["ticket", "support"].includes(item.type)
    && ["title", "description", "subject", "label", "details", "createdAt"].every((key) => typeof item[key] === "string")
    && Number.isFinite(Date.parse(item.createdAt)) && typeof item.read === "boolean"
    && Array.isArray(item.fields) && item.fields.every((field) => field && typeof field.label === "string" && typeof field.value === "string");
}

function loadItems(raw) {
  if (raw === null) return DEMO_NOTIFICATIONS;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isNotification) || new Set(parsed.map((n) => n.id)).size !== parsed.length) throw new Error("Invalid notifications");
  return parsed;
}

function emit() { listeners.forEach((listener) => listener()); }
function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    snapshot = { items: loadItems(window.localStorage.getItem(STORAGE_KEY)), ready: true, persistent: true };
  } catch {
    snapshot = { items: DEMO_NOTIFICATIONS, ready: true, persistent: false };
  }
}
function handleStorage(event) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  try {
    snapshot = { items: loadItems(event.newValue), ready: true, persistent: true };
    emit();
  } catch { /* Não substituir o estado atual por dados inválidos de outra aba. */ }
}
function subscribe(listener) {
  initialize();
  if (listeners.size === 0) window.addEventListener("storage", handleStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
  };
}
function updateItems(updater) {
  initialize();
  const items = updater(snapshot.items);
  let persistent = true;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  catch { persistent = false; }
  snapshot = { items, ready: true, persistent };
  emit();
}

export const notificationActions = {
  markRead(id, read = true) { updateItems((items) => items.map((n) => n.id === id ? { ...n, read } : n)); },
  markAllRead() { updateItems((items) => items.map((n) => ({ ...n, read: true }))); },
  remove(id) { updateItems((items) => items.filter((n) => n.id !== id)); },
  restore(item) { updateItems((items) => items.some((n) => n.id === item.id) ? items : [...items, item].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))); },
};

export function useNotifications() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
  return { ...state, unreadCount: state.items.filter((item) => !item.read).length, ...notificationActions };
}
