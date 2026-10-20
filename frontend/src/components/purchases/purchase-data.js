// Dados demonstrativos. Substitua por pedidos da sua API quando o backend existir.
export const DEMO_REFERENCE_DATE = "2026-10-20T12:00:00-03:00";
export const PAGE_SIZE = 5;
export const STATUS = {
  confirmed: { label: "Confirmado", icon: "check" },
  completed: { label: "Concluído", icon: "check" },
  canceled: { label: "Cancelado", icon: "close" },
};
export const DEMO_ORDERS = [
  {
    id: "CA-084231", type: "cinema", status: "confirmed", title: "Constelação Kira",
    subtitle: "IMAX 3D · Legendado", image: "/compras/posters/kira.jpg",
    purchasedAt: "2026-10-19T18:42:00-03:00", sessionAt: "2026-10-24T20:30:00-03:00",
    venue: "CineAstra · São Caetano", room: "Sala 03 · IMAX", seats: ["F12", "F13"],
    payment: "Cartão de crédito", paymentDetail: "Final 4821 · à vista",
    items: [{ label: "Ingresso inteiro", quantity: 1, unitPrice: 42 }, { label: "Ingresso meia-entrada", quantity: 1, unitPrice: 21 }, { label: "Combo Duo", quantity: 1, unitPrice: 44.9 }],
    fee: 4, discount: 10, discountLabel: "Benefício CineAstra", total: 101.9,
    timeline: [{ title: "Pedido criado", at: "2026-10-19T18:42:00-03:00" }, { title: "Pagamento aprovado", at: "2026-10-19T18:43:00-03:00" }],
  },
  {
    id: "CA-083918", type: "streaming", status: "completed", title: "O Último Fotograma",
    subtitle: "Aluguel digital · 4K", image: "/compras/posters/fotograma.jpg",
    purchasedAt: "2026-10-15T21:16:00-03:00", payment: "Pix", paymentDetail: "Pagamento à vista",
    access: "Aluguel encerrado em 17 de outubro de 2026.",
    items: [{ label: "Aluguel digital — O Último Fotograma", quantity: 1, unitPrice: 19.9 }], fee: 0, discount: 0, total: 19.9,
    timeline: [{ title: "Pedido criado", at: "2026-10-15T21:16:00-03:00" }, { title: "Pagamento aprovado", at: "2026-10-15T21:17:00-03:00" }],
  },
  {
    id: "CA-083504", type: "cinema", status: "completed", title: "Maré Vermelha",
    subtitle: "2 ingressos · 2D · Dublado", image: "/compras/posters/mare.jpg",
    purchasedAt: "2026-10-09T14:08:00-03:00", sessionAt: "2026-10-10T19:00:00-03:00",
    venue: "CineAstra · São Caetano", room: "Sala 01", seats: ["H08", "H09"],
    payment: "Cartão de crédito", paymentDetail: "Final 4821 · à vista",
    items: [{ label: "Ingresso inteiro", quantity: 2, unitPrice: 34 }, { label: "Pipoca caramelizada", quantity: 1, unitPrice: 28.9 }], fee: 4, discount: 0, total: 100.9,
    timeline: [{ title: "Pedido criado", at: "2026-10-09T14:08:00-03:00" }, { title: "Pagamento aprovado", at: "2026-10-09T14:09:00-03:00" }, { title: "Sessão realizada", at: "2026-10-10T19:00:00-03:00" }],
  },
  {
    id: "CA-083012", type: "streaming", status: "completed", title: "CineAstra Essencial",
    subtitle: "Assinatura · Mensalidade de outubro", image: "/compras/posters/essencial.svg",
    purchasedAt: "2026-10-01T08:00:00-03:00", payment: "Cartão de crédito", paymentDetail: "Final 4821 · à vista",
    access: "Cobrança referente ao período de 01 a 31 de outubro de 2026.",
    items: [{ label: "Plano Essencial — outubro de 2026", quantity: 1, unitPrice: 24.9 }], fee: 0, discount: 0, total: 24.9,
    timeline: [{ title: "Cobrança criada", at: "2026-10-01T08:00:00-03:00" }, { title: "Pagamento aprovado", at: "2026-10-01T08:01:00-03:00" }],
  },
  {
    id: "CA-082544", type: "cinema", status: "canceled", title: "Baile das Sombras",
    subtitle: "2 ingressos · 2D · Legendado", image: "/compras/posters/sombras.jpg",
    purchasedAt: "2026-09-26T16:24:00-03:00", sessionAt: "2026-09-28T22:00:00-03:00",
    venue: "CineAstra · São Caetano", room: "Sala 04", seats: ["D06", "D07"],
    payment: "Pix", paymentDetail: "Pagamento à vista", refund: "Estorno concluído em 27 de setembro de 2026.",
    items: [{ label: "Ingresso inteiro", quantity: 2, unitPrice: 34 }], fee: 4, discount: 0, total: 72,
    timeline: [{ title: "Pedido criado", at: "2026-09-26T16:24:00-03:00" }, { title: "Pagamento aprovado", at: "2026-09-26T16:25:00-03:00" }, { title: "Cancelamento solicitado", at: "2026-09-27T09:30:00-03:00" }, { title: "Estorno concluído", at: "2026-09-27T17:08:00-03:00" }],
  },
  {
    id: "CA-081906", type: "cinema", status: "completed", title: "O Segredo de Gaia",
    subtitle: "3 ingressos · 3D · Dublado", image: "/compras/posters/gaia.jpg",
    purchasedAt: "2026-09-12T10:12:00-03:00", sessionAt: "2026-09-13T15:30:00-03:00",
    venue: "CineAstra · Santo André", room: "Sala 02", seats: ["G05", "G06", "G07"],
    payment: "Cartão de débito", paymentDetail: "Final 1820 · à vista",
    items: [{ label: "Ingresso inteiro", quantity: 1, unitPrice: 36 }, { label: "Ingresso meia-entrada", quantity: 2, unitPrice: 18 }], fee: 6, discount: 0, total: 78,
    timeline: [{ title: "Pedido criado", at: "2026-09-12T10:12:00-03:00" }, { title: "Pagamento aprovado", at: "2026-09-12T10:13:00-03:00" }, { title: "Sessão realizada", at: "2026-09-13T15:30:00-03:00" }],
  },
  {
    id: "CA-081040", type: "streaming", status: "completed", title: "CineAstra Essencial",
    subtitle: "Assinatura · Mensalidade de setembro", image: "/compras/posters/essencial.svg",
    purchasedAt: "2026-09-01T08:00:00-03:00", payment: "Cartão de crédito", paymentDetail: "Final 4821 · à vista",
    access: "Cobrança referente ao período de 01 a 30 de setembro de 2026.",
    items: [{ label: "Plano Essencial — setembro de 2026", quantity: 1, unitPrice: 24.9 }], fee: 0, discount: 0, total: 24.9,
    timeline: [{ title: "Cobrança criada", at: "2026-09-01T08:00:00-03:00" }, { title: "Pagamento aprovado", at: "2026-09-01T08:01:00-03:00" }],
  },
  {
    id: "CA-079812", type: "cinema", status: "completed", title: "Sete Invernos",
    subtitle: "1 ingresso · 2D · Legendado", image: "/compras/posters/invernos.jpg",
    purchasedAt: "2026-08-08T12:19:00-03:00", sessionAt: "2026-08-09T17:15:00-03:00",
    venue: "CineAstra · São Caetano", room: "Sala 05", seats: ["E11"],
    payment: "Pix", paymentDetail: "Pagamento à vista",
    items: [{ label: "Ingresso meia-entrada", quantity: 1, unitPrice: 17 }], fee: 2, discount: 0, total: 19,
    timeline: [{ title: "Pedido criado", at: "2026-08-08T12:19:00-03:00" }, { title: "Pagamento aprovado", at: "2026-08-08T12:20:00-03:00" }, { title: "Sessão realizada", at: "2026-08-09T17:15:00-03:00" }],
  },
];
const locale = "pt-BR";
const timeZone = "America/Sao_Paulo";
export const money = (value) => new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(value);
export const date = (value, opts = {}) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", timeZone, ...opts }).format(new Date(value));
export const time = (value) => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(value));
export const month = (value) => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone }).format(new Date(value));
export const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function filterOrders(orders, { type = "all", status = "all", period = "all", query = "" } = {}, referenceDate = DEMO_REFERENCE_DATE) {
  const now = new Date(referenceDate).getTime();
  const needle = normalize(query.trim());
  return orders.filter((order) => {
    const age = now - new Date(order.purchasedAt).getTime();
    return (type === "all" || order.type === type)
      && (status === "all" || order.status === status)
      && (period === "all" || age >= 0 && age <= Number(period) * 86400000)
      && (!needle || normalize(`${order.id} ${order.title} ${order.subtitle}`).includes(needle));
  }).sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
}
export function nextSession(orders, referenceDate = DEMO_REFERENCE_DATE) {
  return orders.filter((o) => o.type === "cinema" && o.status === "confirmed" && new Date(o.sessionAt) >= new Date(referenceDate)).sort((a, b) => new Date(a.sessionAt) - new Date(b.sessionAt))[0];
}
export function orderSummary(order) {
  const lines = ["CINEASTRA · RESUMO DO PEDIDO", order.id, "", order.title, order.subtitle, `Compra em ${date(order.purchasedAt)} às ${time(order.purchasedAt)}`, `Situação: ${STATUS[order.status].label}`, ""];
  if (order.sessionAt) lines.push(`Sessão: ${date(order.sessionAt)} às ${time(order.sessionAt)}`, order.venue, order.room, `Assentos: ${order.seats.join(", ")}`, "");
  if (order.access) lines.push(order.access, "");
  for (const item of order.items) lines.push(`${item.quantity} × ${item.label}: ${money(item.quantity * item.unitPrice)}`);
  lines.push(`Taxa de serviço: ${money(order.fee)}`, `Descontos: -${money(order.discount)}`, `Total ${order.status === "canceled" ? "estornado" : "pago"}: ${money(order.total)}`, "", `Pagamento: ${order.payment} · ${order.paymentDetail}`);
  if (order.refund) lines.push(order.refund);
  lines.push("", "Este resumo não é uma nota fiscal nem um ingresso.");
  return lines.join("\n");
}
