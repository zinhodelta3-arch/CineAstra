"use client";

import { useRef, useState } from 'react';
import { BENEFITS, CATEGORIES, STEPS, FAQ } from './data';
import './parcerias.css';

// Ícones SVG locais: a página não exige instalar bibliotecas de ícones.
function Icon({ name = 'star', ...props }) {
  const paths = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    ticket: <><path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Z" /><path d="M15 7v2m0 2v2m0 2v2" /></>,
    star: <path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.5l6.3-.9L12 3Z" />,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
    film: <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M7 3v18M17 3v18M3 8h4m-4 8h4M17 8h4m-4 8h4" /></>,
  };
  return <svg className="ca-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.star}</svg>;
}

function SectionHeading({ eyebrow, title, description }) {
  return <div className="ca-section-head"><div><p className="ca-eyebrow"><Icon name="film" />{eyebrow}</p><h2 className="ca-display">{title}</h2></div>{description && <p className="ca-muted">{description}</p>}</div>;
}

function Coupon({ benefit }) {
  const codeRef = useRef(null);
  const [status, setStatus] = useState('');

  async function copyCode() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(benefit.code);
      setStatus('Código de demonstração copiado.');
    } catch {
      const selection = window.getSelection();
      if (selection && codeRef.current) {
        const range = document.createRange();
        range.selectNodeContents(codeRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setStatus('Copie o código selecionado com Ctrl+C ou pelo menu do celular.');
    }
  }

  return <div className="ca-redeem">
    <span className="ca-category">{benefit.code ? 'Seu cupom de exemplo' : 'Como utilizar'}</span>
    {benefit.code ? <div className="ca-coupon"><code ref={codeRef}>{benefit.code}</code><button type="button" onClick={copyCode} aria-label={`Copiar cupom de demonstração ${benefit.brand}`}><Icon name="copy" /><span>Copiar</span></button></div> : <p className="ca-payment-note"><Icon name="ticket" />Pague com um cartão elegível do parceiro. Não precisa de cupom.</p>}
    {benefit.code && <p className="ca-copy-status" role="status">{status}</p>}
  </div>;
}

function BenefitCard({ benefit }) {
  return <article id={`parceria-${benefit.id}`} className={`ca-offer-card ca-partner-${benefit.id} bg-card border-border`} aria-labelledby={`title-${benefit.id}`}>
    <div className="ca-partner-photo">
      <img src={benefit.image} alt={benefit.imageAlt} width="1100" height="733" loading="lazy" />
      <div className="ca-photo-shade" />
      <div className="ca-photo-meta"><span>{benefit.reference}</span><span>{benefit.category}</span></div>
      <div className="ca-photo-caption"><span className="ca-brand-name" data-brand={benefit.id}>{benefit.brand}</span><p>{benefit.title}</p></div>
      <div className="ca-photo-perf" aria-hidden="true" />
    </div>
    <div className="ca-partner-content">
      <div className="ca-card-main">
        <span className="ca-category">Vantagens dessa parceria</span>
        <h3 id={`title-${benefit.id}`} className="ca-display">{benefit.highlight}</h3>
        <p className="ca-partner-intro">{benefit.description}</p>
        <ul className="ca-perks">{benefit.perks.map((perk) => <li key={perk.label}><strong className="ca-perk-value ca-display">{perk.value}</strong><div><h4>{perk.label}</h4><p>{perk.note}</p></div></li>)}</ul>
        <div className="ca-card-condition"><Icon name="check" /><span>{benefit.eligibility}</span></div>
        <div className="ca-visible-rules"><h4>Vale saber antes da sessão</h4><ul>{benefit.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul></div>
      </div>
      <div className="ca-ticket-tear" aria-hidden="true" />
      <Coupon benefit={benefit} />
    </div>
  </article>;
}

export default function ParceriasPage() {
  const [category, setCategory] = useState('Todos');
  const benefits = category === 'Todos' ? BENEFITS : BENEFITS.filter((benefit) => benefit.category === category);

  return <main className="ca-benefits min-h-screen bg-background text-foreground">
    <section className="ca-hero ca-hero-cinema">
      <img className="ca-hero-photo" src="/parcerias/sala-cinema.jpg" alt="" aria-hidden="true" width="1800" height="1200" fetchPriority="high" />
      <div className="ca-hero-shade" aria-hidden="true" />
      <div className="ca-wrap ca-hero-stage">
        <nav aria-label="Navegação estrutural" className="ca-breadcrumb"><a href="/">Cinema</a><span aria-hidden="true">/</span><span aria-current="page">Parcerias e benefícios</span></nav>
        <div className="ca-opening-credit"><span>CineAstra apresenta</span><span>Além da tela / Vol. 01</span></div>
        <div className="ca-hero-copy-block">
          <p className="ca-eyebrow"><span className="ca-credit-line" aria-hidden="true" />O cinema fica ainda melhor quando a gente soma.</p>
          <h1 className="ca-display">Parcerias<br /><span className="ca-title-second"><span className="ca-amp">&</span> <em>benefícios.</em></span></h1>
          <p className="ca-hero-copy">O filme você escolhe. As vantagens ficam por nossa conta. Descubra quem chega junto para deixar o ingresso, a pipoca e a sua próxima sessão ainda melhores.</p>
          <div className="ca-actions"><a className="ca-btn" href="#beneficios">Encontrar minha vantagem <Icon name="arrow" /></a><a className="ca-hero-text-link" href="#como-funciona">Como funciona <span aria-hidden="true">↗</span></a></div>
        </div>
        <div className="ca-hero-footer"><span>INGRESSO. PIPOCA. BOA COMPANHIA.</span><p>O melhor da sessão<br /><strong>começa antes do filme.</strong></p><span className="ca-hero-signature" aria-hidden="true">CineAstra ✦</span></div>
      </div>
      <div className="ca-perf" aria-hidden="true" />
    </section>

    <div className="ca-strip"><div className="ca-wrap"><span><Icon name="ticket" />Vantagens em ingressos</span><span><Icon name="star" />Combos com condições especiais</span><span><Icon name="film" />Mais motivos para voltar</span></div></div>

    <section className="ca-section ca-wrap" aria-label="Benefício em destaque">
      <div className="ca-feature"><div className="ca-feature-copy"><span className="ca-eyebrow"><Icon name="star" />Em destaque / especial de estreia</span><h2 className="ca-display">Um bom filme.<br />Uma ótima companhia.</h2><p>A próxima história fica melhor quando é compartilhada. Conheça a proposta do Astra Duo para a sua próxima sessão a dois.</p><a className="ca-btn" href="#parceria-astra" onClick={() => setCategory('Todos')}>Astra Duo, logo abaixo <Icon name="arrow" /></a></div><div className="ca-feature-stub"><div className="ca-display ca-offer-number">20<span>%</span></div><p>de desconto<br /><strong>para a dupla</strong></p><small>OFERTA DEMONSTRATIVA / 003</small></div></div>
      <p className="ca-disclaimer">Conceito de campanha. Os parceiros, percentuais e condições desta página são exemplos para o projeto.</p>
    </section>

    <section id="beneficios" className="ca-wrap ca-section" style={{paddingTop:0,scrollMarginTop:100}}>
      <SectionHeading eyebrow="Escolha a sua vantagem" title="Quem chega junto." description="Conheça as marcas, escolha sua vantagem e confira todos os benefícios. Está tudo aqui, sem letras escondidas." />
      <div className="ca-toolbar"><div className="ca-filters" role="group" aria-label="Filtrar benefícios por categoria">{CATEGORIES.map((item) => <button type="button" key={item} className="ca-filter" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><small role="status">{benefits.length} {benefits.length === 1 ? 'parceria de exemplo' : 'parcerias de exemplo'}</small></div>
      <div className="ca-offers" data-filtered={category !== 'Todos'}>{benefits.map((benefit) => <BenefitCard key={benefit.id} benefit={benefit} />)}</div>
    </section>

    <section id="como-funciona" className="ca-section ca-steps-section" style={{scrollMarginTop:90}}><div className="ca-wrap">
      <SectionHeading eyebrow="Sem roteiro complicado" title="Do benefício à sessão." description="Três cenas para entender como funciona. As regras de cada oferta sempre vêm primeiro." />
      <div className="ca-steps">{STEPS.map((step, index) => <article className="ca-frame" key={step.title}><div className="ca-frame-perf" aria-hidden="true" /><div className="ca-frame-inner"><div className="ca-frame-top"><span className="ca-display" aria-label={`Passo ${index + 1}`}>0{index + 1}</span><Icon name={step.icon} /></div><h3>{step.title}</h3><p>{step.description}</p></div><div className="ca-frame-perf" aria-hidden="true" /></article>)}</div>
    </div></section>

    <section className="ca-section ca-wrap"><SectionHeading eyebrow="Juntos na mesma história" title="Marcas em cena." description="Uma seleção de marcas para apresentar como as parcerias podem aparecer no CineAstra." /><div className="ca-brands">{BENEFITS.map((benefit) => <div className="ca-brand-item" key={benefit.id}><strong className="ca-brand-name" data-brand={benefit.id}>{benefit.brand}</strong><span>{benefit.id === 'astra' ? 'Experiências da casa' : benefit.category}</span></div>)}</div><p className="ca-disclaimer">Marcas citadas como referência visual. Nenhuma parceria comercial é confirmada por esta demonstração.</p></section>

    <section className="ca-section ca-wrap ca-bottom-grid" style={{paddingTop:0}}><div><p className="ca-eyebrow"><Icon name="ticket" />Antes de começar</p><h2 className="ca-display">Ficou alguma<br />dúvida?</h2><p className="ca-muted" style={{fontSize:15,lineHeight:1.85,maxWidth:330}}>Os detalhes fazem parte de uma boa experiência. Veja o que considerar antes de aproveitar uma oferta.</p></div><div className="ca-faq">{FAQ.map(([question, answer]) => <details key={question}><summary>{question}<Icon name="plus" /></summary><p>{answer}</p></details>)}</div></section>
    <div className="ca-end-note"><div className="ca-wrap"><span>CineAstra ✦ Parcerias e benefícios</span><span>Projeto demonstrativo · Condições sujeitas à definição</span></div></div>
  </main>;
}
