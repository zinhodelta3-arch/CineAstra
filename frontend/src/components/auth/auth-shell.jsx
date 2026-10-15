"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

function Field({ label, icon: Icon, type = "text", value, onChange, placeholder, autoComplete, required = true, minLength, maxLength }) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div className="grid gap-[7px]">
      <label htmlFor={inputId} className="text-xs font-extrabold text-foreground">{label}</label>
      <span className="relative flex items-center">
        <Icon className="pointer-events-none absolute left-3.5 z-10 size-[18px] text-muted-foreground" aria-hidden="true" />
        <Input
          id={inputId}
          className="h-12 w-full rounded-lg border-input bg-background px-[42px] text-base shadow-none placeholder:text-muted-foreground md:text-sm dark:bg-background"
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 size-10 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
            aria-controls={inputId}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        )}
      </span>
    </div>
  );
}

function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <main className="relative flex min-h-[calc(100svh-81px)] flex-col items-center justify-center overflow-hidden bg-background px-3.5 pt-[34px] pb-[50px] text-foreground min-[701px]:px-5 min-[701px]:pt-14 min-[701px]:pb-[72px]">
      <section className="relative grid w-full max-w-[920px] overflow-hidden rounded-2xl border border-border bg-card min-[701px]:min-h-[560px] min-[701px]:grid-cols-[minmax(0,1fr)_210px]" aria-labelledby="auth-title">
        <span className="pointer-events-none absolute top-1/2 -left-[13px] z-10 size-6 -translate-y-1/2 rounded-full border border-border bg-background [clip-path:inset(0_0_0_50%)]" aria-hidden="true" />
        <span className="pointer-events-none absolute top-1/2 -right-[13px] z-10 size-6 -translate-y-1/2 rounded-full border border-border bg-background [clip-path:inset(0_50%_0_0)] min-[701px]:right-[197px]" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-x-6 top-1 h-px border-t border-dashed border-border opacity-75" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-x-6 bottom-1 h-px border-t border-dashed border-border opacity-75" aria-hidden="true" />

        <div className="relative min-w-0 px-[22px] pt-[30px] pb-[34px] min-[521px]:px-[clamp(28px,5vw,58px)] min-[521px]:pt-[38px] min-[521px]:pb-[42px]">
          <Link href="/" className="mb-7 inline-flex items-center gap-2 rounded-sm text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para a Home
          </Link>

          <div className="mb-3.5 flex h-[58px] w-[190px] max-w-full items-center [&_img]:size-full [&_img]:object-contain [&_img]:object-left">
            <img src="/CineAstra.png" alt="CineAstra" />
          </div>

          <p className="mb-1 text-[11px] font-extrabold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>
          <h1 id="auth-title" className="m-0 font-sans text-[clamp(32px,4vw,46px)] leading-tight font-extrabold tracking-[-0.04em] text-foreground">{title}</h1>
          <p className="mt-[13px] mb-7 max-w-[560px] text-sm leading-relaxed text-muted-foreground">{description}</p>

          {children}
        </div>

        <aside className="relative flex min-h-[130px] items-center justify-center border-t-2 border-dashed border-border bg-secondary px-4 py-6 text-secondary-foreground min-[701px]:border-t-0 min-[701px]:border-l-2" aria-label="CineAstra">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center min-[701px]:flex-col min-[701px]:gap-[13px] [&_strong]:text-xl [&_strong]:leading-none [&_strong]:tracking-[-0.04em] min-[701px]:[&_strong]:text-[27px]">
            <span className="text-[10px] font-black tracking-[0.22em]">CINEASTRA</span>
            <strong>VIVA O<br />CINEMA.</strong>
            <span className="h-0.5 w-8 bg-accent min-[701px]:w-[58px]" />
            <div className="flex h-10 items-end gap-0.5 opacity-75 min-[701px]:h-[58px]" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, index) => (
                <i key={index} className={`block bg-current ${index % 3 === 0 ? "w-[3px]" : "w-px"} ${["h-1/2", "h-3/4", "h-full", "h-2/3"][index % 4]}`} />
              ))}
            </div>
          </div>
        </aside>
      </section>
      {footer}
    </main>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ email: "", phone: "", password: "", confirmPassword: "" });
  const [accepted, setAccepted] = useState(false);
  const termsId = useId();
  const [message, setMessage] = useState("");

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  function handleSubmit(event) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }
    if (!accepted) {
      setMessage("Você precisa concordar com os Termos de Uso e a Política de Privacidade.");
      return;
    }
    setMessage("Cadastro validado! A integração com o backend será conectada nesta etapa.");
  }

  return (
    <AuthCard
      eyebrow="Novo ingresso"
      title="Crie sua conta"
      description="Cadastre-se para comprar ingressos, acompanhar seus pedidos e aproveitar sua experiência CineAstra."
      footer={
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground [&_a]:rounded-sm [&_a]:font-extrabold [&_a]:text-primary [&_a:hover]:underline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-ring">
          Já possui uma conta? <Link href="/login">Entrar na CineAstra</Link>
        </p>
      }
    >
      <form className="grid gap-[17px]" onSubmit={handleSubmit}>
        <Field label="E-mail" icon={Mail} type="email" value={form.email} onChange={update("email")} placeholder="seuemail@exemplo.com" autoComplete="email" />
        <Field label="Telefone" icon={Phone} type="tel" value={form.phone} onChange={update("phone")} placeholder="(11) 99999-9999" autoComplete="tel" />

        <div className="grid grid-cols-1 gap-[17px] min-[521px]:grid-cols-2 min-[521px]:gap-4">
          <Field label="Senha" icon={LockKeyhole} type="password" value={form.password} onChange={update("password")} placeholder="••••••••" autoComplete="new-password" minLength={8} />
          <Field label="Confirmar senha" icon={LockKeyhole} type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="••••••••" autoComplete="new-password" minLength={8} />
        </div>

        <div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground [&_a]:font-bold [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline">
          <Checkbox id={termsId} className="mt-0.5 shrink-0" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} />
          <label htmlFor={termsId} className="cursor-pointer">
            Li e concordo com os <a href="#" onClick={(event) => event.preventDefault()}>Termos de Uso</a> e a <a href="#" onClick={(event) => event.preventDefault()}>Política de Privacidade</a>.
          </label>
        </div>

        {message && <p className="m-0 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground" role="status">{message}</p>}

        <Button className="h-12 w-full gap-2 rounded-lg text-sm font-bold shadow-none" type="submit">
          <Check size={18} aria-hidden="true" />
          Criar minha conta
        </Button>
      </form>
    </AuthCard>
  );
}

export function LoginPage() {
  const [form, setForm] = useState({ login: "", password: "" });
  const [resetOpen, setResetOpen] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("Login validado! A autenticação com o backend será conectada nesta etapa.");
  }

  return (
    <AuthCard
      eyebrow="Bem-vindo de volta"
      title="Entre na CineAstra"
      description="Acesse sua conta para continuar sua experiência de cinema."
      footer={
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground [&_a]:rounded-sm [&_a]:font-extrabold [&_a]:text-primary [&_a:hover]:underline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-ring">
          Ainda não possui uma conta? <Link href="/cadastro">Criar conta</Link>
        </p>
      }
    >
      {!resetOpen ? (
        <form className="grid gap-[17px]" onSubmit={handleSubmit}>
          <Field label="Nome de usuário ou e-mail" icon={UserRound} value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} placeholder="Seu usuário ou e-mail" autoComplete="username" />
          <Field label="Senha" icon={LockKeyhole} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" autoComplete="current-password" />

          <Button type="button" variant="link" className="-mt-1 h-auto justify-self-end p-0 text-xs font-bold text-primary" onClick={() => { setResetOpen(true); setMessage(""); }}>
            Esqueci minha senha
          </Button>

          {message && <p className="m-0 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground" role="status">{message}</p>}

          <Button className="h-12 w-full gap-2 rounded-lg text-sm font-bold shadow-none" type="submit">
            Entrar
          </Button>
        </form>
      ) : (
        <form className="grid gap-[17px]" onSubmit={(event) => { event.preventDefault(); setMessage("Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha."); }}>
          <Field label="Nome de usuário ou e-mail" icon={Mail} type="email" value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} placeholder="seuemail@exemplo.com" autoComplete="email" />
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">Informe o e-mail da sua conta e enviaremos as instruções para criar uma nova senha.</p>
          {message && <p className="m-0 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground" role="status">{message}</p>}
          <Button className="h-12 w-full gap-2 rounded-lg text-sm font-bold shadow-none" type="submit">Redefinir senha</Button>
          <Button type="button" variant="link" className="-mt-1 h-auto justify-self-end p-0 text-xs font-bold text-primary" onClick={() => { setResetOpen(false); setMessage(""); }}>
            Voltar para o login
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
