"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import {
  ACTIVE_PROFILE_KEY, AVATARS, DEFAULT_PROFILES, MAX_PROFILES,
  PROFILE_STORAGE_KEY, STREAMING_PATH, avatarSource,
  parseProfiles, readProfilePhoto, validateName,
} from "./profile-data";
import "./profiles.css";

export function ProfileIcon({ name, ...props }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="m16 3 5 5-12 12-6 1 1-6Z" /><path d="m14 5 5 5" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></>,
    play: <path d="m9 5 11 7L9 19Z" />,
    film: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18M17 3v18M3 8h4m-4 8h4M17 8h4m-4 8h4" /></>,
    star: <path d="m12 2 2.6 6.9L22 9.3l-5.8 4.8 1.9 7.2L12 17.2l-6.1 4.1 1.9-7.2L2 9.3l7.4-.4Z" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.film}</svg>;
}

function Modal({ open, onClose, title, description, children, small = false, returnFocus }) {
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="sp-backdrop" />
      <Dialog.Popup className={`sp-root sp-dialog ${small ? "sp-dialog-small" : ""}`} finalFocus={returnFocus}>
        <div className="sp-dialog-perf" aria-hidden="true" />
        <div className="sp-dialog-header">
          <div><p className="sp-eyebrow"><ProfileIcon name="film" /> SEU ESPAÇO NO CINEASTRA</p><Dialog.Title className="sp-dialog-title">{title}</Dialog.Title></div>
          <Dialog.Close className="sp-icon-button" aria-label="Fechar janela"><ProfileIcon name="close" /></Dialog.Close>
        </div>
        <Dialog.Description className="sp-dialog-description">{description}</Dialog.Description>
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

function ProfileEditor({ profile, profiles, onSave, onClose, onDelete, returnFocus }) {
  const [draft, setDraft] = useState(profile || { name: "", avatar: AVATARS[profiles.length % AVATARS.length].id, photo: "", kids: false });
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const update = (field, value) => { setDraft((p) => ({ ...p, [field]: value })); setError(""); };
  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true); setError("");
    try {
      const photo = await readProfilePhoto(file);
      if (alive.current) setDraft((p) => ({ ...p, photo }));
    } catch (err) { if (alive.current) setError(err.message); }
    finally { if (alive.current) setPhotoBusy(false); }
  };
  const submit = (event) => {
    event.preventDefault();
    const invalid = validateName(draft.name, profiles, profile?.id);
    if (invalid) return setError(invalid);
    const saveError = onSave({ ...draft, name: draft.name.trim() });
    if (saveError) setError(saveError);
  };
  return <Modal open onClose={onClose} title={profile ? "Esse perfil é a sua cara." : "Uma nova história por aqui."} description={profile ? "Ajuste o nome e escolha quem vai representar você na tela." : "Dê um nome ao perfil e escolha um avatar para começar."} returnFocus={returnFocus}>
    <form onSubmit={submit} noValidate>
      <div className="sp-editor-top">
        <div className="sp-photo-wrap"><img className="sp-editor-photo" src={avatarSource(draft)} alt="Prévia da foto do perfil" /><span className="sp-photo-stamp" aria-hidden="true"><ProfileIcon name="star" /></span></div>
        <div className="sp-editor-field"><label htmlFor="sp-profile-name">Nome do perfil</label><input id="sp-profile-name" className="sp-input" value={draft.name} onChange={(e) => update("name", e.target.value)} maxLength={24} placeholder="Como podemos chamar você?" autoComplete="off" aria-invalid={Boolean(error)} aria-describedby="sp-editor-error sp-name-count" /><span id="sp-name-count" className="sp-field-hint">{draft.name.length}/24 caracteres</span></div>
      </div>
      <div className="sp-section-label"><span>ESCOLHA SEU AVATAR</span><span>01 — 08</span></div>
      <div className="sp-avatar-grid" role="group" aria-label="Avatares disponíveis">
        {AVATARS.map((avatar) => <button className={`sp-avatar-option ${draft.avatar === avatar.id && !draft.photo ? "is-selected" : ""}`} key={avatar.id} type="button" onClick={() => { setDraft((p) => ({ ...p, avatar: avatar.id, photo: "" })); setError(""); }} aria-label={avatar.name} aria-pressed={draft.avatar === avatar.id && !draft.photo} disabled={photoBusy} title={avatar.name}>
          <img src={`/streaming/avatars/${avatar.id}.svg`} alt="" />{draft.avatar === avatar.id && !draft.photo && <span className="sp-avatar-check"><ProfileIcon name="check" /></span>}
        </button>)}
      </div>
      <div className="sp-upload-row"><input ref={fileRef} className="sp-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-label="Enviar foto de perfil" /><Button className="sp-btn sp-btn-outline sp-btn-compact" variant="outline" type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy}><ProfileIcon name="upload" /> {photoBusy ? "Preparando foto..." : "Enviar minha foto"}</Button><span className="sp-field-hint">JPG, PNG ou WebP · até 5 MB</span></div>
      {draft.photo && <button className="sp-text-button" type="button" onClick={() => update("photo", "")} disabled={photoBusy}>Remover foto e usar avatar</button>}
      <label className="sp-kids-row"><span><strong>Perfil infantil</strong><small>Um espaço com identificação especial para os pequenos.</small></span><input type="checkbox" className="sp-switch-input" checked={draft.kids} onChange={(e) => update("kids", e.target.checked)} /><span className="sp-switch" aria-hidden="true" /></label>
      <p id="sp-editor-error" className="sp-error" role="alert">{error}</p>
      <div className="sp-dialog-actions">
        {profile && <Button className="sp-btn sp-btn-danger-text" variant="ghost" type="button" disabled={profiles.length <= 1 || photoBusy} onClick={onDelete} title={profiles.length <= 1 ? "Mantenha pelo menos um perfil na conta." : undefined}><ProfileIcon name="trash" /> Excluir perfil</Button>}
        <div className="sp-actions-right"><Button className="sp-btn sp-btn-outline" variant="outline" type="button" onClick={onClose}>Cancelar</Button><Button className="sp-btn sp-btn-primary" type="submit" disabled={photoBusy}>{profile ? "Salvar alterações" : "Criar perfil"}<ProfileIcon name="check" /></Button></div>
      </div>
      {profile && profiles.length <= 1 && <p className="sp-field-hint sp-last-hint">Sua conta precisa ter pelo menos um perfil.</p>}
    </form>
  </Modal>;
}

export default function ProfilesClient({ onSelectProfile, showHeader = true }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [ready, setReady] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeId, setActiveId] = useState("");
  const [entering, setEntering] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const pageRef = useRef(null);
  const returnFocus = useRef(null);
  const manageRef = useRef(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      const current = raw ? parseProfiles(raw) : DEFAULT_PROFILES;
      setProfiles(current);
      const id = localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
      setActiveId(current.some((p) => p.id === id) ? id : "");
    } catch { setNotice("Não foi possível recuperar os perfis salvos. Os perfis de exemplo estão disponíveis."); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  // A gravação só acontece em uma ação explícita, nunca na primeira renderização.
  const persist = (next) => {
    try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next)); }
    catch { return "Não foi possível salvar. Verifique o armazenamento do navegador e tente uma foto menor."; }
    setProfiles(next);
    return "";
  };
  const openEditor = (profile, element) => {
    returnFocus.current = element || manageRef.current;
    setEditor(profile || "new");
  };
  const save = (draft) => {
    if (!draft.id && profiles.length >= MAX_PROFILES) return "Você pode ter até cinco perfis.";
    const item = { ...draft, id: draft.id || globalThis.crypto?.randomUUID?.() || `perfil-${Date.now()}` };
    const next = draft.id ? profiles.map((p) => p.id === draft.id ? item : p) : [...profiles, item];
    const error = persist(next);
    if (error) return error;
    setNotice(draft.id ? "Perfil atualizado. Ficou a sua cara!" : "Novo perfil criado. A próxima história é sua.");
    setEditor(null);
    return "";
  };
  const remove = () => {
    if (!deleting || profiles.length <= 1) return;
    // Limpa a seleção antes de remover um perfil que estava ativo.
    if (deleting.id === activeId) {
      try { localStorage.removeItem(ACTIVE_PROFILE_KEY); }
      catch { setDeleteError("Não foi possível atualizar o perfil ativo. Tente novamente."); return; }
      setActiveId("");
    }
    const error = persist(profiles.filter((p) => p.id !== deleting.id));
    if (error) return setDeleteError(error);
    setNotice(`O perfil ${deleting.name} foi excluído.`);
    setDeleting(null);
  };
  const select = (profile, element) => {
    if (managing) return openEditor(profile, element);
    try {
      // Também materializa os exemplos, para a home conseguir recuperar o perfil pelo ID.
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    } catch { setNotice("Não foi possível selecionar o perfil. Verifique o armazenamento do navegador."); return; }
    setActiveId(profile.id);
    if (onSelectProfile) return onSelectProfile(profile);
    setEntering(true);
    router.push(STREAMING_PATH);
  };
  return <main ref={pageRef} className={`sp-root sp-page ${managing ? "sp-managing" : ""}`}>
    <div className="sp-grain" aria-hidden="true" /><div className="sp-orbit sp-orbit-one" aria-hidden="true" /><div className="sp-orbit sp-orbit-two" aria-hidden="true" />
    {showHeader && <header className="sp-header"><a href="/" className="sp-brand" aria-label="CineAstra, página inicial">{logoAvailable ? <img src="/CineAstras.png" alt="CineAstra" onError={() => setLogoAvailable(false)} /> : <><ProfileIcon name="star" /><span>Cine<span>Astra</span></span></>}<span className="sp-brand-divider" /><span className="sp-brand-streaming">STREAMING</span></a><div className="sp-header-tag"><span /> A SUA SESSÃO COMEÇA AQUI</div></header>}
    <section className="sp-main" aria-labelledby="sp-title">
      <div className="sp-scene-label"><span className="sp-scene-line" /><ProfileIcon name="film" /><span>{managing ? "NOS BASTIDORES" : "LUZ, CÂMERA... VOCÊ."}</span><span className="sp-scene-line" /></div>
      <h1 id="sp-title" className="sp-title">{managing ? <>CADA PERFIL,<br /><em>UMA HISTÓRIA.</em></> : <>QUEM VAI<br /><em>DAR O PLAY?</em></>}</h1>
      <p className="sp-subtitle">{managing ? "Escolha um perfil para editar. Deixe cada espaço com a sua cara." : "O mesmo universo. Um jeito só seu de assistir."}</p>
      <div className="sp-profiles" aria-label={managing ? "Gerenciar perfis" : "Escolher um perfil"} aria-busy={!ready}>
        {profiles.map((profile, index) => <button type="button" className="sp-profile" key={profile.id} onClick={(e) => select(profile, e.currentTarget)} aria-label={managing ? `Editar perfil ${profile.name}` : `Assistir como ${profile.name}`} disabled={!ready || entering} style={{ "--sp-delay": `${index * 65}ms` }}>
          <span className="sp-frame"><span className="sp-frame-perf" aria-hidden="true" /><img src={avatarSource(profile)} alt="" className="sp-profile-img" /><span className="sp-frame-number" aria-hidden="true">0{index + 1}</span>{profile.kids && <span className="sp-kids-badge">KIDS</span>}<span className="sp-hover-screen"><span className="sp-play-circle"><ProfileIcon name={managing ? "edit" : "play"} /></span></span><span className="sp-frame-bottom" aria-hidden="true" /></span>
          <span className="sp-profile-info"><span className="sp-profile-name">{profile.name}</span>{managing ? <span className="sp-profile-caption">Editar perfil <ProfileIcon name="edit" /></span> : <span className="sp-profile-caption">{activeId === profile.id ? "Último acesso" : profile.kids ? "Pequenos espectadores" : "Seu lugar na primeira fila"}</span>}</span>
        </button>)}
        {profiles.length < MAX_PROFILES && <button type="button" className="sp-profile sp-add-profile" onClick={(e) => openEditor(null, e.currentTarget)} disabled={!ready || entering} style={{ "--sp-delay": `${profiles.length * 65}ms` }} aria-label="Adicionar perfil"><span className="sp-add-frame"><span className="sp-add-plus"><ProfileIcon name="plus" /></span><span className="sp-add-cross sp-add-cross-one" aria-hidden="true" /><span className="sp-add-cross sp-add-cross-two" aria-hidden="true" /></span><span className="sp-profile-info"><span className="sp-profile-name">Novo perfil</span><span className="sp-profile-caption">Mais uma boa história</span></span></button>}
      </div>
      <div className="sp-manage-area"><Button ref={manageRef} className={`sp-btn ${managing ? "sp-btn-primary" : "sp-btn-outline"}`} variant={managing ? "default" : "outline"} disabled={!ready || entering} onClick={() => setManaging((v) => !v)}><ProfileIcon name={managing ? "check" : "edit"} />{managing ? "Concluir edição" : "Gerenciar perfis"}</Button><span className="sp-profile-count">{String(profiles.length).padStart(2, "0")} / 0{MAX_PROFILES} PERFIS</span></div>
      <p className="sp-personal-note">{entering ? "Preparando sua próxima sessão..." : "Cada perfil guarda seu próprio jeito de viver o cinema."}</p>
    </section>
    <footer className="sp-footer"><span>CINEASTRA <span className="sp-footer-star">✦</span> ALÉM DA TELA</span><div className="sp-footer-perf" aria-hidden="true" /><span>SUA HISTÓRIA. SEU PLAY.</span></footer>
    <div className={`sp-toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite">{notice && <><ProfileIcon name="film" /><span>{notice}</span><button className="sp-icon-button" aria-label="Fechar aviso" onClick={() => setNotice("")}><ProfileIcon name="close" /></button></>}</div>
    {editor && <ProfileEditor key={editor === "new" ? "new" : editor.id} profile={editor === "new" ? null : editor} profiles={profiles} onClose={() => setEditor(null)} onSave={save} returnFocus={returnFocus} onDelete={() => { const item = editor; setEditor(null); setDeleteError(""); returnFocus.current = manageRef.current; setDeleting(item); }} />}
    {deleting && <Modal open small title="Fim dessa história?" description={`Deseja excluir o perfil ${deleting.name}? A foto e as preferências deste perfil serão removidas deste navegador. Essa ação não pode ser desfeita.`} returnFocus={manageRef} onClose={() => { const item = deleting; setDeleting(null); setEditor(item); }}>
      <div className="sp-delete-profile"><img src={avatarSource(deleting)} alt="" /><div><strong>{deleting.name}</strong><span>Perfil do streaming</span></div><ProfileIcon name="trash" /></div><p className="sp-error" role="alert">{deleteError}</p><div className="sp-dialog-actions"><Button type="button" className="sp-btn sp-btn-outline" variant="outline" onClick={() => { const item = deleting; setDeleting(null); setEditor(item); }}>Manter perfil</Button><Button type="button" className="sp-btn sp-btn-destructive" variant="destructive" onClick={remove}><ProfileIcon name="trash" /> Sim, excluir perfil</Button></div>
    </Modal>}
  </main>;
}
