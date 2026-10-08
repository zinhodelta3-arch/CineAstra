"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  InstagramLogo,
  FacebookLogo,
  XLogo,
  YoutubeLogo,
  PaperPlaneTilt,
  ShieldCheck,
  MapPin,
  Phone,
  Ticket,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const socialLinks = [
  { icon: InstagramLogo, href: "#", label: "Instagram" },
  { icon: FacebookLogo, href: "#", label: "Facebook" },
  { icon: XLogo, href: "#", label: "X" },
  { icon: YoutubeLogo, href: "#", label: "YouTube" },
];

const footerSections = [
  {
    title: "Programação",
    items: [
      "Filmes em cartaz",
      "Próximas estreias",
      "Sessões IMAX 3D",
      "Salas VIP Gold Class",
      "Festivais e mostras",
    ],
  },
  {
    title: "Experiência",
    items: [
      "Bomboniere e pipocas gourmet",
      "Aluguel privado de salas",
      "Eventos corporativos",
      "Cartão presente",
      "Passe anual VIP",
    ],
  },
  {
    title: "Suporte",
    items: [
      "Meia-entrada",
      "Acessibilidade",
      "Perguntas frequentes",
      "Termos de uso",
      "Política de privacidade",
    ],
  },
];

const paymentMethods = ["Visa", "Mastercard", "Apple Pay", "PIX"];

// Largura das barras do código de barras (fixo, evita erro de hidratação)
const barcode = [
  2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 1, 2, 2, 1, 4, 1,
  2, 3, 1, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 1, 3,
];

/** Meia-lua que simula o recorte do ingresso */
function Notch({ className = "", side }) {
  const clip = {
    top: "inset(50% 0 0 0)",
    bottom: "inset(0 0 50% 0)",
    left: "inset(0 0 0 50%)",
    right: "inset(0 50% 0 0)",
  }[side];

  return (
    <span
      aria-hidden="true"
      style={{ clipPath: clip }}
      className={`absolute z-10 h-6 w-6 rounded-full border border-border bg-card ${className}`}
    />
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!subscribed) return;
    const timeout = window.setTimeout(() => setSubscribed(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [subscribed]);

  function handleSubscribe(event) {
    event.preventDefault();
    if (!email.trim()) return;
    setEmail("");
    setSubscribed(true);
  }

  return (
    <footer className="relative mt-auto bg-card text-card-foreground">
      {/* LINHA PONTILHADA ESTILO TICKET/INGRESSO NO TOPO DO FOOTER */}
      <div
        aria-hidden="true"
        className="relative flex w-full items-center overflow-hidden"
      >
        {/* Recorte semicircular esquerdo */}
        <div className="h-6 w-6 -translate-x-1/2 rounded-full border border-border bg-background" />

        {/* Linha tracejada do ticket */}
        <div className="flex-1 border-t-2 border-dashed border-border" />

        {/* Recorte semicircular direito */}
        <div className="h-6 w-6 translate-x-1/2 rounded-full border border-border bg-background" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* INGRESSO / NEWSLETTER */}
        <section
          aria-labelledby="club-title"
          className="relative mb-16 flex flex-col overflow-visible rounded-2xl border border-border bg-background lg:flex-row"
        >
          {/* Recortes: vertical (mobile) */}
          <Notch side="right" className="-left-3 top-[calc(58%-12px)] lg:hidden" />
          <Notch side="left" className="-right-3 top-[calc(58%-12px)] lg:hidden" />
          {/* Recortes: horizontal (desktop) */}
          <Notch side="bottom" className="-top-3 left-[calc(66.666%-12px)] hidden lg:block" />
          <Notch side="top" className="-bottom-3 left-[calc(66.666%-12px)] hidden lg:block" />

          {/* Corpo do ingresso */}
          <div className="flex flex-1 flex-col justify-between gap-8 p-6 sm:p-8 lg:basis-2/3 lg:p-10">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Ticket className="h-4 w-4 text-primary" weight="duotone" aria-hidden="true" />
              Admit one · CineAstra Club
            </div>

            <div className="space-y-3">
              <h2
                id="club-title"
                className="max-w-lg text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                Seu lugar na pré-estreia começa aqui.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Receba convites, lançamentos e ofertas do CineAstra direto no
                seu e-mail.
              </p>
            </div>

            {/* Código de barras decorativo */}
            <div
              aria-hidden="true"
              className="flex h-8 items-end gap-[2px] opacity-40"
            >
              {barcode.map((w, i) => (
                <span
                  key={i}
                  className="h-full bg-foreground"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
          </div>

          {/* Linha picotada */}
          <div
            aria-hidden="true"
            className="mx-6 border-t-2 border-dashed border-border lg:mx-0 lg:my-6 lg:border-l-2 lg:border-t-0"
          />

          {/* Canhoto */}
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:basis-1/3">
            <p className="text-xs font-medium text-muted-foreground">
              Seu e-mail
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <label htmlFor="footer-email" className="sr-only">
                Seu e-mail
              </label>
              <Input
                id="footer-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                className="h-11 bg-card"
              />
              <Button type="submit" className="h-11 gap-2">
                Entrar no Club
                <PaperPlaneTilt className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            <p
              role="status"
              aria-live="polite"
              className="flex min-h-5 items-center gap-1.5 text-xs font-medium text-emerald-500"
            >
              {subscribed && (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Inscrição confirmada. Bem-vindo ao Club.
                </>
              )}
            </p>
          </div>
        </section>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Marca */}
          <div className="space-y-6 lg:col-span-2">
            <a href="/" aria-label="CineAstra, página inicial" className="inline-block">
              <Image
                src="/CineAstra.png"
                alt="CineAstra"
                width={160}
                height={44}
                className="h-23 w-auto"
              />
            </a>

            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Descubra filmes, acompanhe sessões e garanta seu ingresso em
              poucos toques.
            </p>

            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Av. das Estrelas, 1000 — Centro Cultural CineAstra
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                +55 (11) 0000-0000
              </li>
            </ul>

            {/* ÍCONES DAS REDES SOCIAIS */}
            <div className="flex items-center gap-5 pt-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  onClick={(e) => href === "#" && e.preventDefault()}
                  className="text-muted-foreground transition-colors duration-200 hover:text-[#FAD241]"
                >
                  <Icon
                    className="h-5 w-5"
                    weight="bold"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Colunas de links */}
          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {section.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator className="my-10" />

        {/* BARRA INFERIOR */}
        <div className="flex flex-col items-center justify-between gap-5 text-xs text-muted-foreground md:flex-row">
          <span>
            © {new Date().getFullYear()} CineAstra Cinemas. Todos os direitos
            reservados.
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1">Pagamentos</span>
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded-md border border-dashed border-border px-2.5 py-1 font-medium text-foreground/80"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}