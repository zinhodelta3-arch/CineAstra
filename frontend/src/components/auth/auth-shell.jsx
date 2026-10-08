"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import styles from "./auth-shell.module.css";

function Field({ label, icon: Icon, type = "text", value, onChange, placeholder, autoComplete, required = true, minLength, maxLength }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.inputWrap}>
        <Icon className={styles.inputIcon} aria-hidden="true" />
        <input
          className={styles.input}
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
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
    </label>
  );
}

function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.ticket} aria-labelledby="auth-title">
        <span className={styles.notchLeft} aria-hidden="true" />
        <span className={styles.notchRight} aria-hidden="true" />
        <span className={styles.perforationTop} aria-hidden="true" />
        <span className={styles.perforationBottom} aria-hidden="true" />

        <div className={styles.ticketMain}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para a Home
          </Link>

          <div className={styles.brandLogo}>
            <img src="/CineAstra.png" alt="CineAstra" />
          </div>

          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 id="auth-title" className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>

          {children}
        </div>

        <aside className={styles.ticketStub} aria-label="CineAstra">
          <div className={styles.stubContent}>
            <span className={styles.stubLabel}>CINEASTRA</span>
            <strong>VIVA O<br />CINEMA.</strong>
            <span className={styles.stubLine} />
            <div className={styles.barcode} aria-hidden="true">
              {Array.from({ length: 24 }).map((_, index) => (
                <i key={index} style={{ height: `${45 + ((index * 17) % 50)}%`, width: index % 3 === 0 ? 3 : 1 }} />
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
        <p className={styles.switchText}>
          Já possui uma conta? <Link href="/login">Entrar na CineAstra</Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="E-mail" icon={Mail} type="email" value={form.email} onChange={update("email")} placeholder="seuemail@exemplo.com" autoComplete="email" />
        <Field label="Telefone" icon={Phone} type="tel" value={form.phone} onChange={update("phone")} placeholder="(11) 99999-9999" autoComplete="tel" />

        <div className={styles.twoColumns}>
          <Field label="Senha" icon={LockKeyhole} type="password" value={form.password} onChange={update("password")} placeholder="••••••••" autoComplete="new-password" minLength={8} />
          <Field label="Confirmar senha" icon={LockKeyhole} type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="••••••••" autoComplete="new-password" minLength={8} />
        </div>

        <label className={styles.checkRow}>
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>
            Li e concordo com os <a href="#" onClick={(event) => event.preventDefault()}>Termos de Uso</a> e a <a href="#" onClick={(event) => event.preventDefault()}>Política de Privacidade</a>.
          </span>
        </label>

        {message && <p className={styles.formMessage} role="status">{message}</p>}

        <button className={styles.primaryButton} type="submit">
          <Check size={18} aria-hidden="true" />
          Criar minha conta
        </button>
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
        <p className={styles.switchText}>
          Ainda não possui uma conta? <Link href="/cadastro">Criar conta</Link>
        </p>
      }
    >
      {!resetOpen ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <Field label="Nome de usuário ou e-mail" icon={UserRound} value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} placeholder="Seu usuário ou e-mail" autoComplete="username" />
          <Field label="Senha" icon={LockKeyhole} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" autoComplete="current-password" />

          <button type="button" className={styles.textButton} onClick={() => { setResetOpen(true); setMessage(""); }}>
            Esqueci minha senha
          </button>

          {message && <p className={styles.formMessage} role="status">{message}</p>}

          <button className={styles.primaryButton} type="submit">
            Entrar
          </button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); setMessage("Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha."); }}>
          <Field label="Nome de usuário ou e-mail" icon={Mail} type="email" value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} placeholder="seuemail@exemplo.com" autoComplete="email" />
          <p className={styles.resetHint}>Informe o e-mail da sua conta e enviaremos as instruções para criar uma nova senha.</p>
          {message && <p className={styles.formMessage} role="status">{message}</p>}
          <button className={styles.primaryButton} type="submit">Redefinir senha</button>
          <button type="button" className={styles.textButton} onClick={() => { setResetOpen(false); setMessage(""); }}>
            Voltar para o login
          </button>
        </form>
      )}
    </AuthCard>
  );
}
