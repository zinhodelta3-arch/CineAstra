"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bookmark, CalendarDays, Check, ChevronDown,
  ChevronRight, CreditCard, Film, History, LockKeyhole, LogOut,
  Mail, MapPin, Pencil, Phone, Plus, ShieldCheck,
  Sparkles, Star, Ticket, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import "./cinema-profile.css";

// Protótipo frontend: todos os dados abaixo são fictícios, mantidos em memória.
const INITIAL_PROFILE = {
  name: "Alex Morgan", email: "alex.morgan@example.com", phone: "(11) 99999-0000",
  city: "São Paulo, SP", avatar: "AM",
};
const MOVIES = [
  { id: "fotograma", title: "O Último Fotograma", genre: "Suspense · Drama", duration: "2h 08min", score: "4.9", image: "photo-1478720568477-152d9b164e26", sessions: ["14:30", "17:15", "20:00"], summary: "Rolos de filme esquecidos em um estúdio abandonado revelam eventos capazes de reescrever o passado." },
  { id: "kira", title: "Constelação Kira", genre: "Ficção científica", duration: "2h 21min", score: "4.8", image: "photo-1446776811953-b23d57bd21aa", sessions: ["15:00", "18:20", "21:10"], summary: "Uma expedição segue um sinal vindo de uma nebulosa onde as leis da física já não se aplicam." },
  { id: "gaia", title: "O Segredo de Gaia", genre: "Animação · Aventura", duration: "1h 38min", score: "4.9", image: "photo-1534447677768-be436bb09401", sessions: ["11:00", "13:15", "15:30"], summary: "Uma jovem exploradora encontra um mundo extraordinário e descobre o segredo que o mantém vivo." },
];
const TICKETS = [
  { id: "CA-20481", movieId: "fotograma", date: "09 out. 2026", time: "20:00", venue: "CineAstra Paulista", room: "Sala 03 · IMAX 3D", seats: "F08, F09", quantity: 2, entry: "Inteira", total: 120.9, combo: "Combo Duo Gold", status: "Confirmado" },
  { id: "CA-20502", movieId: "kira", date: "11 out. 2026", time: "18:20", venue: "CineAstra São Caetano", room: "Sala 01 · Dolby Atmos", seats: "E12", quantity: 1, entry: "Inteira", total: 38, combo: "Sem combo", status: "Confirmado" },
  { id: "CA-20529", movieId: "gaia", date: "12 out. 2026", time: "15:30", venue: "CineAstra Paulista", room: "Sala 05 · 2D", seats: "D10, D11", quantity: 2, entry: "Inteira", total: 76, combo: "Sem combo", status: "Confirmado" },
];
const PURCHASES = [
  { id: "CA-19862", title: "Baile das Sombras", date: "27 set. 2026", total: 120.9, items: "2 ingressos + Combo Duo Gold", venue: "CineAstra Paulista", status: "Concluído" },
  { id: "CA-19308", title: "Sete Invernos", date: "18 set. 2026", total: 38, items: "1 ingresso inteiro", venue: "CineAstra São Caetano", status: "Concluído" },
  { id: "CA-18410", title: "Maré Vermelha", date: "05 set. 2026", total: 104.9, items: "2 ingressos + Pipoca Gourmet", venue: "CineAstra Paulista", status: "Concluído" },
];
const INITIAL_CARDS = [
  { id: "card-1", brand: "Visa", last4: "4829", nickname: "Meu cartão", expiry: "08/29", isDefault: true },
  { id: "card-2", brand: "Mastercard", last4: "9012", nickname: "Cartão de viagens", expiry: "11/28", isDefault: false },
  { id: "card-3", brand: "Elo", last4: "3456", nickname: "Cartão adicional", expiry: "03/30", isDefault: false },
];
const money = (amount) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
const poster = (movie, width = 500) => `https://images.unsplash.com/${movie.image}?auto=format&fit=crop&w=${width}&q=85`;
const movieFor = (ticket) => MOVIES.find((movie) => movie.id === ticket.movieId);
const actionClass = "h-10 rounded-full px-5 font-bold";

function SectionHeading({ icon: Icon, title, count, children }) {
  return <div className="mb-5 flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-2.5 text-lg font-bold"><Icon className="size-4 text-primary" />{title}{count !== undefined && <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{count}</span>}</h2>
    {children}
  </div>;
}

// DialogTrigger fica ligado à ação para devolver o foco ao fechar o modal.
// Base UI usa render, em vez de asChild, na composição com Button.
function Modal({ trigger, title, description, children, open, onOpenChange, wide = false }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    {trigger && <DialogTrigger render={trigger} />}
    <DialogContent showCloseButton={false} className={`ca-profile-dialog max-h-[88dvh] overflow-y-auto rounded-2xl border-border bg-card p-6 text-card-foreground sm:p-8 ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
      <DialogClose render={<Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full" aria-label="Fechar janela"><X className="size-4" /></Button>} />
      <DialogHeader className="pr-8 text-left">
        <p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-primary uppercase"><Film className="size-3.5" />CineAstra Cinema</p>
        <DialogTitle className="ca-display text-4xl font-black uppercase">{title}</DialogTitle>
        <DialogDescription className="mt-2 leading-relaxed text-muted-foreground">{description}</DialogDescription>
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>;
}

function Field({ label, id, ...props }) {
  return <div className="space-y-2"><label htmlFor={id} className="text-xs font-semibold text-muted-foreground">{label}</label><Input id={id} className="h-11 rounded-lg border-border bg-background" {...props} /></div>;
}

function PosterImage({ movie, className = "" }) {
  const [failed, setFailed] = useState(false);
  return <div className={`relative overflow-hidden bg-secondary ${className}`}>
    {failed ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center text-secondary-foreground"><Film className="size-7 opacity-50" /><span className="text-[10px]">{movie.title}</span></div> : <img src={poster(movie)} alt={`Imagem ilustrativa de ${movie.title}`} onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />}
  </div>;
}

function FavoriteCard({ movie, onRemove }) {
  return <article className="group min-w-0">
    <div className="relative mb-3"><PosterImage movie={movie} className="aspect-[3/4] rounded-lg border border-border" /><div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <Button variant="secondary" size="icon" className="absolute top-2 right-2 size-8 rounded-full border border-white/20 bg-background/85 text-primary backdrop-blur" aria-label={`Remover ${movie.title} dos favoritos`} onClick={() => onRemove(movie.id)}><Bookmark className="size-3.5 fill-current" /></Button>
      <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-bold text-white"><Star className="size-3 fill-current text-primary" />{movie.score}</span>
    </div>
    <h3 className="truncate text-xs font-bold" title={movie.title}>{movie.title}</h3><p className="mt-1 truncate text-[10px] text-muted-foreground">{movie.genre}</p>
    <Modal trigger={<Button variant="link" className="mt-2 h-auto justify-start p-0 text-[10px] font-semibold">Ver sessões<ArrowRight className="size-3" /></Button>} title={movie.title} description={`${movie.genre} · ${movie.duration}`}>
      <p className="text-sm leading-relaxed text-muted-foreground">{movie.summary}</p><div className="rounded-xl border border-border bg-background p-4"><p className="mb-3 text-xs font-bold">Sessões ilustrativas</p><div className="flex flex-wrap gap-2">{movie.sessions.map((session) => <span key={session} className="rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">{session}</span>)}</div><p className="mt-3 text-xs text-muted-foreground">Consulte a programação do cinema para comprar ingressos.</p></div>
    </Modal>
  </article>;
}

function PurchaseList({ onSelect, selectedPurchase, closePurchase }) {
  return <div className="space-y-1">{PURCHASES.map((purchase) => <div key={purchase.id} className="border-b border-border py-4 last:border-b-0">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-xs font-bold">{purchase.title}</h3><p className="mt-1.5 text-[10px] text-muted-foreground">{purchase.date} · {purchase.id}</p></div><span className="shrink-0 text-xs font-semibold">{money(purchase.total)}</span></div>
    <Modal open={onSelect ? selectedPurchase === purchase.id : undefined} onOpenChange={onSelect ? (isOpen) => isOpen ? onSelect(purchase.id) : closePurchase() : undefined} trigger={<Button variant="link" className="mt-2 h-auto p-0 text-[10px]">Ver compra<ChevronRight className="size-3" /></Button>} title="Detalhes da compra" description={`Pedido ${purchase.id} · ${purchase.date}`}>
      <div className="space-y-4 rounded-xl border border-border bg-background p-5"><h3 className="text-lg font-bold">{purchase.title}</h3><p className="text-sm text-muted-foreground">{purchase.items}</p><p className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4" />{purchase.venue}</p><div className="flex items-center justify-between border-t border-dashed border-border pt-4"><span className="text-sm">Total pago</span><strong className="text-lg text-primary">{money(purchase.total)}</strong></div><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary"><Check className="size-3" />{purchase.status}</span></div><p className="text-xs text-muted-foreground">Compra fictícia para demonstração do histórico.</p>
    </Modal>
  </div>)}</div>;
}

function TicketDetails({ ticket }) {
  const movie = movieFor(ticket);
  return <div className="ca-ticket overflow-hidden rounded-xl border border-border bg-background"><div className="ca-perf" aria-hidden="true" /><div className="p-5"><p className="mb-2 text-[10px] font-bold tracking-widest text-primary uppercase">{ticket.room}</p><h3 className="ca-display text-4xl font-black uppercase">{movie.title}</h3><dl className="mt-5 grid grid-cols-2 gap-4 text-xs">{[["Data", ticket.date], ["Horário", ticket.time], ["Cinema", ticket.venue], ["Assentos", ticket.seats], ["Ingressos", `${ticket.quantity} × ${ticket.entry}`], ["Bomboniere", ticket.combo]].map(([label, value]) => <div key={label}><dt className="mb-1 text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl></div><div className="flex items-center justify-between gap-4 border-t-2 border-dashed border-border p-5"><div><p className="text-[10px] text-muted-foreground">Pedido {ticket.id}</p><p className="mt-1 text-lg font-bold text-primary">{money(ticket.total)}</p></div><span className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary">{ticket.status}</span></div><p className="px-5 pb-5 text-[11px] text-muted-foreground">Ingresso demonstrativo. Não é válido para entrada no cinema.</p></div>;
}

function TicketRow({ ticket }) {
  const movie = movieFor(ticket);
  return <article className="ca-ticket grid grid-cols-[56px_minmax(0,1fr)] items-center gap-4 rounded-xl border border-border bg-background p-3 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-5 sm:p-4">
    <PosterImage movie={movie} className="h-20 rounded-md sm:h-22" /><div className="min-w-0"><div className="mb-1.5 flex flex-wrap items-center gap-2"><span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">{ticket.room.split(" · ")[1]}</span><span className="flex items-center gap-1 text-[9px] text-muted-foreground"><Check className="size-3 text-primary" />Confirmado</span></div><h3 className="truncate text-sm font-bold" title={movie.title}>{movie.title}</h3><p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><CalendarDays className="size-3" />{ticket.date}<span>·</span>{ticket.time}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{ticket.venue} · Assentos {ticket.seats}</p></div>
    <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto sm:flex-col sm:items-end sm:border-l sm:border-dashed sm:border-border sm:pl-5"><span className="text-sm font-bold">{money(ticket.total)}</span><Modal trigger={<Button variant="outline" size="sm" className="mt-1 rounded-full px-3 text-[10px]">Ver ingresso<ArrowRight className="size-3" /></Button>} title="Seu ingresso" description="Todos os detalhes da sua próxima sessão."><TicketDetails ticket={ticket} /></Modal></div>
  </article>;
}

function EditProfile({ profile, onSave }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  const change = (field, value) => setDraft((previous) => ({ ...previous, [field]: value }));
  function submit(event) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.email.trim()) { setError("Preencha seu nome e e-mail."); return; }
    if (draft.phone && draft.phone.replace(/\D/g, "").length < 10) { setError("Informe um telefone com DDD ou deixe o campo vazio."); return; }
    onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() }); setOpen(false);
  }
  return <Modal open={open} onOpenChange={(isOpen) => { if (isOpen) { setDraft(profile); setError(""); } setOpen(isOpen); }} trigger={<Button variant="outline" className={`${actionClass} mt-5 w-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10`}><Pencil className="size-3.5" />Editar perfil</Button>} title="Seu perfil" description="Atualize as informações usadas na sua experiência de cinema.">
    <form onSubmit={submit} className="space-y-5"><Field label="Nome completo" id="profile-name" value={draft.name} onChange={(e) => change("name", e.target.value)} autoComplete="name" required maxLength={80} /><Field label="E-mail" id="profile-email" type="email" value={draft.email} onChange={(e) => change("email", e.target.value)} autoComplete="email" required maxLength={120} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Telefone (opcional)" id="profile-phone" type="tel" value={draft.phone} onChange={(e) => change("phone", e.target.value)} autoComplete="tel" maxLength={20} /><Field label="Cidade (opcional)" id="profile-city" value={draft.city} onChange={(e) => change("city", e.target.value)} autoComplete="address-level2" maxLength={80} /></div>
      <fieldset><legend className="mb-2 text-xs font-semibold text-muted-foreground">Avatar</legend><div className="flex flex-wrap gap-2">{["AM", "film", "star", "ticket"].map((avatar) => <Button type="button" key={avatar} variant="outline" size="icon" aria-label={avatar === "AM" ? "Usar iniciais do nome" : `Usar avatar ${avatar}`} aria-pressed={draft.avatar === avatar} onClick={() => change("avatar", avatar)} className={`size-11 rounded-full ${draft.avatar === avatar ? "border-primary bg-primary/10 text-primary" : ""}`}><ProfileAvatar avatar={avatar} name={draft.name} small /></Button>)}</div></fieldset>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}<p className="text-[11px] text-muted-foreground">Nesta demonstração, as alterações duram até recarregar a página.</p><div className="flex justify-end gap-2 border-t border-border pt-5"><DialogClose render={<Button type="button" variant="outline" className={actionClass}>Cancelar</Button>} /><Button type="submit" className={actionClass}><Check className="size-4" />Salvar alterações</Button></div>
    </form>
  </Modal>;
}

function ProfileAvatar({ avatar, name, small = false }) {
  const icons = { film: Film, star: Star, ticket: Ticket };
  const Icon = icons[avatar];
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CA";
  return Icon ? <Icon className={small ? "size-4" : "size-9"} /> : <span className={small ? "text-xs font-bold" : "ca-display text-4xl font-black"}>{initials}</span>;
}

function PaymentCard({ card, onDefault, onRemove }) {
  return <article className="rounded-xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-2"><CreditCard className="size-5 text-primary" /><strong className="text-xs">{card.brand}</strong></div><p className="mt-5 font-mono text-sm tracking-widest">•••• •••• •••• {card.last4}</p><div className="mt-3 flex justify-between gap-2 text-[10px] text-muted-foreground"><span className="truncate">{card.nickname}</span><span>{card.expiry}</span></div><div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3"><Button variant="ghost" size="sm" aria-pressed={card.isDefault} onClick={() => onDefault(card.id)} className={`h-7 rounded-full px-2 text-[10px] ${card.isDefault ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>{card.isDefault ? <Check className="size-3" /> : null}{card.isDefault ? "Padrão" : "Usar como padrão"}</Button><Modal trigger={<Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-destructive" aria-label={`Remover cartão ${card.brand} final ${card.last4}`}><Trash2 className="size-3.5" /></Button>} title="Remover cartão?" description={`O cartão ${card.brand} com final ${card.last4} será removido desta demonstração.`}><div className="mt-2 flex justify-end gap-2"><DialogClose render={<Button variant="outline" className={actionClass}>Voltar</Button>} /><DialogClose render={<Button variant="destructive" className={actionClass} onClick={() => onRemove(card.id)}>Remover cartão</Button>} /></div></Modal></div></article>;
}

function AddCard({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const last4 = String(values.get("last4"));
    const expiry = String(values.get("expiry"));
    const [month, year] = expiry.split("/").map(Number);
    const now = new Date();
    if (!/^\d{4}$/.test(last4)) { setError("Informe exatamente os quatro últimos dígitos."); return; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) || new Date(2000 + year, month, 1) <= now) { setError("Informe uma validade futura no formato MM/AA."); return; }
    onAdd({ id: crypto.randomUUID(), brand: values.get("brand"), nickname: String(values.get("nickname")).trim() || "Meu cartão", last4, expiry }); setOpen(false);
  }
  return <Modal open={open} onOpenChange={(isOpen) => { setError(""); setOpen(isOpen); }} trigger={<Button variant="outline" className="h-11 w-full rounded-xl border-dashed text-xs text-muted-foreground"><Plus className="size-4" />Adicionar cartão de exemplo</Button>} title="Adicionar cartão" description="Cadastre apenas um identificador fictício para testar a carteira. Nenhuma cobrança é realizada.">
    <form onSubmit={submit} className="space-y-4"><Field label="Apelido" id="card-nickname" name="nickname" placeholder="Ex.: Meu cartão" maxLength={35} /><div className="space-y-2"><label htmlFor="card-brand" className="text-xs font-semibold text-muted-foreground">Bandeira</label><select id="card-brand" name="brand" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"><option>Visa</option><option>Mastercard</option><option>Elo</option><option>American Express</option></select></div><div className="grid grid-cols-2 gap-4"><Field label="Últimos 4 dígitos" id="card-last4" name="last4" placeholder="1234" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required /><Field label="Validade" id="card-expiry" name="expiry" placeholder="MM/AA" inputMode="numeric" pattern="(0[1-9]|1[0-2])/[0-9]{2}" maxLength={5} required /></div><p className="text-[11px] leading-relaxed text-muted-foreground">Use dados fictícios. O protótipo não solicita número completo nem código de segurança.</p>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2 pt-2"><DialogClose render={<Button type="button" variant="outline" className={actionClass}>Cancelar</Button>} /><Button type="submit" className={actionClass}>Adicionar à carteira</Button></div></form>
  </Modal>;
}

function PasswordModal({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirm")) { setError("As senhas precisam ser iguais."); return; }
    event.currentTarget.reset(); setOpen(false); onSuccess("Validação concluída. A senha não foi alterada: esta é uma demonstração.");
  }
  return <Modal open={open} onOpenChange={(isOpen) => { setError(""); setOpen(isOpen); }} trigger={<Button variant="ghost" className="h-9 justify-start rounded-full px-3 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />Alterar senha</Button>} title="Alterar senha" description="Demonstração da interface. Uma alteração real exige integração com a autenticação do CineAstra.">
    <form onSubmit={submit} className="space-y-4"><Field label="Senha atual (fictícia)" id="current-password" name="current" type="password" autoComplete="off" required /><Field label="Nova senha (fictícia)" id="new-password" name="password" type="password" minLength={8} autoComplete="off" required /><Field label="Confirmar nova senha" id="confirm-password" name="confirm" type="password" minLength={8} autoComplete="off" required /><p className="text-[11px] text-muted-foreground">Mínimo de 8 caracteres. As senhas não são salvas ou enviadas.</p>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2 pt-2"><DialogClose render={<Button type="button" variant="outline" className={actionClass}>Cancelar</Button>} /><Button type="submit" className={actionClass}>Validar alteração</Button></div></form>
  </Modal>;
}

export default function CinemaProfilePage() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [favorites, setFavorites] = useState(MOVIES);
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [removedFavorite, setRemovedFavorite] = useState(null);
  const [signedOut, setSignedOut] = useState(false);
  const noticeTimer = useRef(null);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  function notify(message) { clearTimeout(noticeTimer.current); setNotice(message); noticeTimer.current = setTimeout(() => setNotice(""), 6000); }
  function removeFavorite(id) { const movie = favorites.find((item) => item.id === id); setRemovedFavorite(movie); setFavorites((previous) => previous.filter((item) => item.id !== id)); notify("Filme removido dos favoritos."); }
  function setDefault(id) { setCards((previous) => previous.map((card) => ({ ...card, isDefault: card.id === id }))); notify("Cartão padrão atualizado."); }
  function removeCard(id) { setCards((previous) => { const remaining = previous.filter((card) => card.id !== id); if (remaining.length && !remaining.some((card) => card.isDefault)) remaining[0] = { ...remaining[0], isDefault: true }; return remaining; }); notify("Cartão removido."); }
  return <div className="ca-profile min-h-screen bg-background text-foreground">
    {signedOut ? <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center"><Film className="mb-5 size-10 text-primary" /><h1 className="ca-display text-5xl font-black uppercase">Até a próxima sessão.</h1><p className="mt-4 text-sm text-muted-foreground">Você saiu da sessão demonstrativa. A autenticação real será conectada ao projeto.</p><Button className={`${actionClass} mt-8`} onClick={() => setSignedOut(false)}>Voltar à demonstração<ArrowRight className="size-4" /></Button></main> : <main className="mx-auto max-w-[1440px] px-5 pt-8 pb-12 sm:px-8 lg:px-12 lg:pt-10">
      <a href="/cinema" className="mb-7 inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-3.5" />Voltar ao cinema</a>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-primary uppercase"><Sparkles className="size-3.5" />Sua experiência de cinema</p><h1 className="ca-display text-5xl leading-[0.95] font-black uppercase sm:text-6xl lg:text-7xl">Minha <span className="text-primary">conta.</span></h1><p className="mt-3 text-xs text-muted-foreground">Seus filmes, suas sessões. Tudo em um só lugar.</p></div><span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Perfil de cinema</span></div>
      <div className="ca-perf mb-7" aria-hidden="true" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="order-2 min-w-0 space-y-6 lg:order-1 lg:pr-8 lg:border-r lg:border-dashed lg:border-border">
          <div className="grid gap-6 xl:grid-cols-[1.12fr_1fr]">
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><SectionHeading icon={Bookmark} title="Meus favoritos" count={favorites.length} /><div className="grid grid-cols-3 gap-3">{favorites.map((movie) => <FavoriteCard key={movie.id} movie={movie} onRemove={removeFavorite} />)}</div>{favorites.length === 0 && <div className="py-8 text-center"><Bookmark className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="text-xs text-muted-foreground">Seus filmes favoritos aparecerão aqui.</p></div>}{removedFavorite && <Button variant="link" className="mt-4 h-auto p-0 text-[11px]" onClick={() => { setFavorites((previous) => [...previous, removedFavorite]); setRemovedFavorite(null); notify("Filme restaurado aos favoritos."); }}>Desfazer última remoção</Button>}</section>
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><SectionHeading icon={History} title="Histórico" /><PurchaseList selectedPurchase={selectedPurchase} onSelect={setSelectedPurchase} closePurchase={() => setSelectedPurchase(null)} /><Modal open={historyOpen} onOpenChange={setHistoryOpen} trigger={<Button variant="link" className="mt-3 h-auto p-0 text-[11px]">Todas as compras<ArrowRight className="size-3" /></Button>} title="Histórico de compras" description="Veja os pedidos e as sessões que fazem parte da sua história no cinema." wide><PurchaseList /><p className="text-xs text-muted-foreground">{PURCHASES.length} compras demonstrativas.</p></Modal></section>
          </div>
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><SectionHeading icon={Ticket} title="Ingressos ativos" count={TICKETS.length}><span className="hidden text-[10px] text-muted-foreground sm:block">Sua próxima sessão espera por você</span></SectionHeading><div className="space-y-3">{TICKETS.slice(0, 2).map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</div><Modal trigger={<Button variant="ghost" className="mt-4 h-8 w-full rounded-full text-[11px] text-muted-foreground">Ver todos os ingressos<ChevronDown className="size-3.5" /></Button>} title="Ingressos ativos" description="Confira seus ingressos confirmados para as próximas sessões." wide><div className="space-y-3">{TICKETS.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</div></Modal></section>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"><PasswordModal onSuccess={notify} /><Modal trigger={<Button variant="ghost" className="h-9 rounded-full px-3 text-xs text-muted-foreground hover:text-destructive"><LogOut className="size-3.5" />Sair da conta</Button>} title="Sair da conta?" description="Você pode voltar à sessão demonstrativa a qualquer momento."><div className="flex justify-end gap-2"><DialogClose render={<Button variant="outline" className={actionClass}>Continuar aqui</Button>} /><DialogClose render={<Button className={actionClass} onClick={() => { setSignedOut(true); setNotice(""); }}>Sair da demonstração</Button>} /></div></Modal></div>
        </div>
        <aside aria-label="Informações pessoais e cartões" className="order-1 space-y-5 lg:order-2">
          <section className="ca-grain relative overflow-hidden rounded-2xl border border-border bg-card"><div className="ca-profile-cover relative h-25 overflow-hidden border-b border-border"><Film className="absolute -top-3 right-6 size-32 -rotate-12 text-primary/10" /><div className="ca-perf absolute top-4 inset-x-5 opacity-30" /></div><div className="relative px-6 pt-0 pb-6"><div className="-mt-10 mb-4 flex items-end justify-between"><div className="flex size-20 items-center justify-center rounded-full border-[5px] border-card bg-primary text-primary-foreground shadow-lg shadow-primary/10"><ProfileAvatar avatar={profile.avatar} name={profile.name} /></div><span className="mb-2 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">Desde set. 2026</span></div><p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-primary uppercase">O protagonista é você</p><h2 className="ca-display text-4xl font-black break-words uppercase">{profile.name}</h2><div className="mt-5 space-y-3 text-xs text-muted-foreground"><p className="flex items-start gap-2.5"><Mail className="mt-0.5 size-3.5 shrink-0" /><span className="min-w-0 break-all">{profile.email}</span></p><p className="flex items-center gap-2.5"><Phone className="size-3.5 shrink-0" />{profile.phone || "Telefone não informado"}</p><p className="flex items-center gap-2.5"><MapPin className="size-3.5 shrink-0" />{profile.city || "Cidade não informada"}</p></div><EditProfile profile={profile} onSave={(updated) => { setProfile(updated); notify("Perfil atualizado."); }} /><div className="mt-5 grid grid-cols-3 border-t border-dashed border-border pt-5 text-center">{[[TICKETS.length, "Ingressos"], [favorites.length, "Favoritos"], [PURCHASES.length, "Compras"]].map(([value, label]) => <div key={label} className="border-r border-border last:border-r-0"><strong className="ca-display text-2xl text-primary">{value}</strong><p className="mt-0.5 text-[9px] text-muted-foreground">{label}</p></div>)}</div></div></section>
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="mb-4"><button type="button" aria-expanded={cardsExpanded} aria-controls="profile-cards" onClick={() => setCardsExpanded((previous) => !previous)} className="flex w-full items-center justify-between gap-3 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex items-center gap-2.5 text-base font-bold"><CreditCard className="size-4 text-primary" />Meus cartões<span className="text-xs font-normal text-muted-foreground">{cards.length}</span></span><ChevronDown className={`size-4 text-muted-foreground transition-transform ${cardsExpanded ? "rotate-180" : ""}`} /></button></h2>
            {!cardsExpanded && <div className="grid grid-cols-3 gap-2">{cards.slice(0, 3).map((card) => <button type="button" key={card.id} aria-label={`Ver cartão ${card.brand} final ${card.last4}`} onClick={() => setCardsExpanded(true)} className={`ca-mini-card rounded-lg border p-3 text-left transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring ${card.isDefault ? "border-primary/35 bg-primary/10" : "border-border bg-secondary/30"}`}><p className="text-[10px] font-bold">{card.brand}</p><CreditCard className="mt-3 size-4 text-primary" /><p className="mt-2 font-mono text-[9px] text-muted-foreground">•• {card.last4}</p></button>)}</div>}
            <div id="profile-cards" hidden={!cardsExpanded} className="space-y-3">{cards.map((card) => <PaymentCard key={card.id} card={card} onDefault={setDefault} onRemove={removeCard} />)}<AddCard onAdd={(card) => { setCards((previous) => [...previous, { ...card, isDefault: previous.length === 0 }]); notify("Cartão de exemplo adicionado."); }} /></div>{cards.length === 0 && !cardsExpanded && <p className="text-xs text-muted-foreground">Nenhum cartão cadastrado. Abra a carteira para adicionar um exemplo.</p>}<p className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />Carteira demonstrativa com dados mascarados.</p>
          </section>
          <p className="flex items-start gap-2 px-1 text-[10px] leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-3 shrink-0" />Suas informações pessoais ficam reunidas nesta área da conta.</p>
        </aside>
      </div>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[10px] text-muted-foreground"><span className="ca-display text-lg tracking-wide">CINE<span className="text-primary">ASTRA</span></span><span>Uma boa história começa com um ingresso.</span><span>Protótipo · dados fictícios</span></footer>
    </main>}
    <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed right-5 bottom-5 left-5 z-[80] flex justify-center">{notice && <p className="flex max-w-lg items-start gap-2 rounded-xl border border-primary/30 bg-card px-5 py-3 text-xs text-card-foreground shadow-xl"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{notice}</p>}</div>
  </div>;
}
