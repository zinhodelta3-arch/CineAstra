"use client";

import { useCallback, useEffect, useRef, useState, useId } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, X, Subtitles, Settings2, ListVideo, SkipForward, PictureInPicture2, ArrowUpRight, ChevronLeft, Film } from "lucide-react";

const time = (value = 0) => {
  const n = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  return n >= 3600 ? `${Math.floor(n / 3600)}:${String(Math.floor(n / 60) % 60).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}` : `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};
function youtubeEmbed(src) {
  if (!src) return null;
  try {
    const u = new URL(src);
    const host = u.hostname.replace(/^www\./, "");
    let id;
    if (host === "youtu.be") id = u.pathname.slice(1);
    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return /^[\w-]{11}$/.test(id ?? "") ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` : null;
  } catch { return null; }
}
function IconButton({ label, icon: Icon, active, seconds, text, emphasis, ...props }) {
  const id = useId();
  const [tip, setTip] = useState(null);
  const reveal = (event) => {
    const r = event.currentTarget.getBoundingClientRect();
    setTip({ left: Math.max(90, Math.min(window.innerWidth - 90, r.left + r.width / 2)), top: r.top < 70 ? r.bottom + 10 : r.top - 10, below: r.top < 70 });
  };
  return <button type="button" className={`ca-icon ${active ? "is-active" : ""} ${seconds ? "ca-skip" : ""} ${text ? "ca-labelled" : ""} ${emphasis ? "ca-play-control" : ""}`} aria-label={label} aria-describedby={tip ? id : undefined}
    onPointerEnter={(e) => { if (e.pointerType !== "touch") reveal(e); }} onPointerLeave={() => setTip(null)}
    onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) reveal(e); }} onBlur={() => setTip(null)} {...props}>
    <span className="ca-button-icon"><Icon size={seconds ? 29 : 22} aria-hidden="true" />{seconds && <b aria-hidden="true">15</b>}</span>
    {text && <span className="ca-button-text">{text}</span>}
    {tip && <span role="tooltip" id={id} className={`ca-tooltip ${tip.below ? "ca-tip-below" : ""}`} style={{ left: tip.left, top: tip.top }}>{label}</span>}
  </button>;
}

export default function VideoPlayer({ media, options = {}, mode, onModeChange: setMode, onRestore, onEpisodeChange, onClose }) {
  const allEpisodes = (media.seasons ?? []).flatMap((s) => s.episodes.map((e) => ({ ...e, season: s.number })));
  const [episodeId, setEpisodeId] = useState(options.episodeId ?? allEpisodes[0]?.id);
  const episode = allEpisodes.find((e) => e.id === episodeId) ?? allEpisodes[0];
  const content = media.type === "series" ? { ...media, ...episode } : media;
  const [season, setSeason] = useState(episode?.season ?? media.seasons?.[0]?.number);
  const [panel, setPanel] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [caption, setCaption] = useState(-1);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [full, setFull] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [storyboard, setStoryboard] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const dialog = useRef(null), shell = useRef(null), video = useRef(null), surface = useRef(null), timer = useRef(null), gesture = useRef(null), savedAt = useRef(0);
  const autoPlayNext = useRef(false);
  const fullscreenOrigin = useRef(media.type === "trailer" ? "modal" : "page");
  const focusReturn = useRef(null);
  const currentRef = useRef(0);
  const progressKey = `${options.storageKey ?? "cineastra"}:video:${media.id}:${episode?.id ?? "main"}`;
  const embed = youtubeEmbed(content.src);
  const next = allEpisodes[allEpisodes.findIndex((e) => e.id === episode?.id) + 1];
  const frames = content.thumbnails ?? [];
  const thumbnail = frames.filter((f) => f.time <= (hoverTime ?? current)).at(-1) ?? frames[0];

  useEffect(() => {
    focusReturn.current = document.activeElement;
    return () => { clearTimeout(timer.current); focusReturn.current?.focus?.({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    // O mesmo <video> fica montado ao alternar entre os três tamanhos.
    node.close();
    if (mode === "mini" || mode === "page") node.show(); else node.showModal();
    if (mode === "modal" || mode === "expanded") {
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = overflow; };
    }
  }, [mode]);
  useEffect(() => {
    const changed = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    const drag = (e) => { if (gesture.current && gesture.current.y - e.clientY > 25) setStoryboard(true); };
    const end = () => { gesture.current = null; };
    window.addEventListener("pointermove", drag);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => { window.removeEventListener("pointermove", drag); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); };
  }, []);
  useEffect(() => {
    setCurrent(0); currentRef.current = 0; setDuration(0); setStarted(false); setPlaying(false); setError(""); setCaption(-1); setWaiting(false);
    return () => {
      try { if (currentRef.current > 0 && media.type !== "trailer") localStorage.setItem(progressKey, String(currentRef.current)); } catch { /* armazenamento opcional */ }
    };
  }, [content.src, episodeId, progressKey, media.type]);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.volume = volume; el.muted = muted; el.playbackRate = speed;
  }, [volume, muted, speed, content.src, episodeId]);
  useEffect(() => {
    const el = video.current;
    if (el) Array.from(el.textTracks).forEach((track, i) => { track.mode = i === caption ? "showing" : "disabled"; });
  }, [caption, episodeId]);

  useEffect(() => {
    if (options.episodeId && options.episodeId !== episodeId) {
      const selected = allEpisodes.find((e) => e.id === options.episodeId);
      if (selected) { autoPlayNext.current = true; setEpisodeId(selected.id); setSeason(selected.season); setPanel(null); }
    }
  }, [options.episodeId, options.selectionToken]);
  useEffect(() => { onEpisodeChange?.(episode?.id ?? null); }, [episode?.id, onEpisodeChange]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!shell.current?.querySelector(".ca-icon:hover, .ca-icon:focus-visible, .ca-panel:hover")) setControlsVisible(false);
    }, 3500);
  }, []);
  const toggle = useCallback(async () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      try { await el.play(); } catch { setError("Não foi possível iniciar. Tente reproduzir novamente."); }
    } else el.pause();
    showControls();
  }, [showControls]);
  const seek = useCallback((value) => {
    const el = video.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.max(0, Math.min(value, el.duration));
    currentRef.current = el.currentTime; setCurrent(el.currentTime);
  }, []);
  const fullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (mode === "expanded") { setMode(fullscreenOrigin.current); return; }
    fullscreenOrigin.current = mode;
    try {
      if (shell.current?.requestFullscreen && document.fullscreenEnabled) { await shell.current.requestFullscreen(); return; }
      if (video.current?.webkitEnterFullscreen) { video.current.webkitEnterFullscreen(); return; }
    } catch { /* A prévia incorporada pode bloquear a API nativa. */ }
    // Fallback visível e reversível, inclusive quando a prévia bloqueia fullscreen.
    setMode("expanded");
  };
  const changeMode = async (newMode) => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    setPanel(null); setMode(newMode); showControls();
  };
  const selectEpisode = (item) => {
    autoPlayNext.current = true; setEpisodeId(item.id); setSeason(item.season); setPanel(null);
  };
  const close = () => {
    video.current?.pause();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  };
  const updated = () => {
    const el = video.current;
    currentRef.current = el.currentTime; setCurrent(el.currentTime);
    if (el.currentTime - savedAt.current > 5 || el.currentTime < savedAt.current) {
      savedAt.current = el.currentTime;
      try { if (media.type !== "trailer") localStorage.setItem(progressKey, String(el.currentTime)); } catch { /* opcional */ }
    }
  };
  const loaded = () => {
    const el = video.current;
    setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    try {
      const saved = Number(localStorage.getItem(progressKey));
      if (media.type !== "trailer" && saved > 0 && saved < el.duration - 3) el.currentTime = saved;
    } catch { /* opcional */ }
    Array.from(el.textTracks).forEach((t) => { t.mode = "disabled"; });
    if (autoPlayNext.current) { autoPlayNext.current = false; el.play().catch(() => {}); }
  };
  const keyDown = (event) => {
    if (event.key === "Escape" && panel) { event.preventDefault(); event.stopPropagation(); setPanel(null); return; }
    if (event.target.closest("input, select, textarea, button") || embed) return;
    if ([" ", "k", "ArrowLeft", "ArrowRight", "m", "f"].includes(event.key)) event.preventDefault();
    if (event.key === " " || event.key === "k") toggle();
    if (event.key === "ArrowLeft") seek(currentRef.current - 15);
    if (event.key === "ArrowRight") seek(currentRef.current + 15);
    if (event.key === "m") setMuted((v) => !v);
    if (event.key === "f") fullscreen();
    showControls();
  };
  const progressPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setHoverTime(position * duration);
    if (gesture.current && gesture.current.y - event.clientY > 25) setStoryboard(true);
  };
  const visible = controlsVisible || !playing || Boolean(panel) || storyboard || mode === "mini";

  return <dialog ref={dialog} className={`ca-dialog ca-${mode} ${full || mode === "expanded" ? "ca-full" : ""}`} role={mode === "page" ? "region" : undefined} aria-label={`${media.type === "trailer" ? "Trailer" : "Player"}: ${media.title}`}
    onKeyDown={keyDown} onCancel={(e) => { e.preventDefault(); if (panel) setPanel(null); else close(); }}
    onClick={(e) => { if (e.target === dialog.current && mode === "modal") close(); }}>
    <div className="ca-shell" ref={shell} onMouseMove={showControls} onMouseLeave={showControls}>
      <header className="ca-header">
        <div className="ca-player-heading"><strong>{media.title}</strong>{episode && <span>T{episode.season} · E{episode.number} — {episode.title}</span>}</div>
        <div className="ca-header-actions">
          {embed && media.type === "series" && mode !== "mini" && <IconButton label="Temporadas e episódios" text="Episódios" icon={ListVideo} onClick={() => setPanel(panel === "episodes" ? null : "episodes")} />}
          {embed && mode !== "mini" && <IconButton label={full || mode === "expanded" ? "Sair da tela cheia" : "Tela cheia"} icon={full || mode === "expanded" ? Minimize : Maximize} onClick={fullscreen} />}
          {media.type !== "trailer" && mode !== "mini" && <IconButton label="Minimizar player" text="Minimizar" icon={PictureInPicture2} onClick={() => changeMode("mini")} />}
          {mode === "mini" && <IconButton label="Restaurar player" icon={ArrowUpRight} onClick={onRestore} />}
          <IconButton label="Fechar player" icon={X} onClick={close} />
        </div>
      </header>
      <div className="ca-film-frame">
        <div className="ca-perf-v" aria-hidden="true" />
        <div className={`ca-screen ${visible ? "ca-controls-shown" : ""}`} ref={surface} tabIndex={0} aria-label="Área do vídeo. Espaço: pausar. Setas: avançar ou voltar 15 segundos." onPointerMove={showControls}>
          {embed ? <iframe key={embed} src={embed} title={media.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : content.src ?
            <video ref={video} key={`${episodeId ?? media.id}:${content.src}`} src={content.src} poster={content.poster} playsInline preload="metadata"
              onLoadedMetadata={loaded} onTimeUpdate={updated} onPlay={() => { setPlaying(true); setStarted(true); setError(""); showControls(); }} onPause={() => setPlaying(false)}
              onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)} onCanPlay={() => setWaiting(false)} onEnded={() => { setPlaying(false); try { localStorage.removeItem(progressKey); } catch {} currentRef.current = 0; }}
              onError={() => { setWaiting(false); setError("Vídeo indisponível. Confira o endereço do arquivo e tente novamente."); }}
              onClick={toggle} onDoubleClick={fullscreen}>
              {(content.captions ?? []).map((track) => <track key={track.src} kind="subtitles" srcLang={track.lang} label={track.label} src={track.src} />)}
            </video> : <div className="ca-empty"><Film size={38} /><h2>Esta sessão ainda não está disponível.</h2><p>O vídeo de “{media.title}” ainda precisa ser cadastrado.</p></div>}

          {!embed && content.src && !started && !error && <div className="ca-intro">
            <div className="ca-intro-copy">
              {media.logo ? <img className="ca-title-logo" src={media.logo} alt={media.title} /> : <h2>{media.title}</h2>}
              <p className="ca-synopsis">{media.synopsis}</p>
            </div>
            <button type="button" className="ca-start" onClick={toggle} aria-label="Reproduzir vídeo"><Play size={32} fill="currentColor" /></button>
          </div>}
          {!embed && waiting && playing && <div className="ca-loading" role="status">Carregando vídeo…</div>}
          {error && <div className="ca-error" role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); video.current?.load(); }}>Tentar novamente</button></div>}

          {!embed && content.src && <div className={`ca-controls ${visible ? "" : "ca-hidden"}`} inert={!visible ? true : undefined}>
            {storyboard && <div className="ca-storyboard" aria-label="Quadros da linha do tempo">
              <div className="ca-story-head"><button type="button" onClick={() => setStoryboard(false)} aria-label="Fechar quadros"><X size={16} /></button></div>
              <div className="ca-frames">{frames.length ? frames.map((frame) => <button type="button" key={frame.time} onClick={() => { seek(frame.time); setStoryboard(false); }}><img src={frame.src} alt={`Cena em ${time(frame.time)}`} /><span>{time(frame.time)}</span></button>) : <p>Prévias de cenas não disponíveis para este vídeo.</p>}</div>
            </div>}
            <div className="ca-timeline" onPointerMove={progressPointer} onPointerLeave={() => { if (!gesture.current) setHoverTime(null); }}
              onPointerDown={(e) => { gesture.current = { y: e.clientY }; }}
              onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }}>
              {hoverTime !== null && !storyboard && <div className="ca-seek-preview" style={{ left: `${Math.min(88, Math.max(12, duration ? hoverTime / duration * 100 : 0))}%` }}>{thumbnail && <img src={thumbnail.src} alt="Prévia da cena" />}<span>{time(hoverTime)}</span></div>}
              <input type="range" min="0" max={duration || 1} step="0.1" value={current} disabled={!duration} aria-label="Posição do vídeo" aria-valuetext={`${time(current)} de ${time(duration)}`} style={{ "--progress": `${duration ? current / duration * 100 : 0}%` }} onChange={(e) => seek(Number(e.target.value))} />
            </div>
            <div className="ca-control-row">
              <div className="ca-control-group">
                <IconButton label="Voltar 15 segundos" seconds icon={RotateCcw} onClick={() => seek(current - 15)} />
                <IconButton label={playing ? "Pausar" : "Reproduzir"} emphasis icon={playing ? Pause : Play} onClick={toggle} />
                <IconButton label="Avançar 15 segundos" seconds icon={RotateCw} onClick={() => seek(current + 15)} />
                <div className="ca-volume"><IconButton label={muted ? "Ativar som" : "Silenciar"} icon={muted || volume === 0 ? VolumeX : Volume2} onClick={() => setMuted((v) => !v)} /><input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }} /></div>
                <span className="ca-time">{time(current)}<span> / {time(duration)}</span></span>
              </div>
              <div className="ca-control-group ca-options">
                <IconButton label="Legendas" icon={Subtitles} active={panel === "captions"} aria-expanded={panel === "captions"} onClick={() => setPanel(panel === "captions" ? null : "captions")} />
                {media.type === "series" && <IconButton label="Temporadas e episódios" text="Episódios" icon={ListVideo} active={panel === "episodes"} aria-expanded={panel === "episodes"} onClick={() => setPanel(panel === "episodes" ? null : "episodes")} />}
                {media.type === "series" && <IconButton label="Próximo episódio" icon={SkipForward} disabled={!next} onClick={() => next && selectEpisode(next)} />}
                <IconButton label="Configurações" icon={Settings2} active={panel === "settings"} aria-expanded={panel === "settings"} onClick={() => setPanel(panel === "settings" ? null : "settings")} />
                <IconButton label={full || mode === "expanded" ? "Sair da tela cheia" : "Tela cheia"} icon={full || mode === "expanded" ? Minimize : Maximize} onClick={fullscreen} />
              </div>
            </div>
          </div>}

          {panel && mode !== "mini" && <aside className={`ca-panel ca-panel-${panel}`} aria-label={panel === "episodes" ? "Temporadas e episódios" : panel === "captions" ? "Legendas" : "Configurações"}>
            <div className="ca-panel-title"><h2>{panel === "episodes" ? "Episódios" : panel === "captions" ? "Legendas" : "Configurações"}</h2><IconButton label="Fechar painel" icon={X} onClick={() => setPanel(null)} /></div>
            {panel === "settings" && <><label className="ca-select-label">Velocidade<select aria-label="Velocidade" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map((n) => <option key={n} value={n}>{n === 1 ? "Normal" : `${n}×`}</option>)}</select></label><p className="ca-panel-note">Qualidade e áudio acompanham o arquivo disponível.</p><p className="ca-panel-note">Espaço: pausar · ← →: 15 s · M: som · F: tela cheia</p></>}
            {panel === "captions" && <div className="ca-caption-list"><button type="button" aria-pressed={caption === -1} onClick={() => setCaption(-1)}>Desativadas</button>{(content.captions ?? []).map((track, i) => <button type="button" key={track.src} aria-pressed={caption === i} onClick={() => setCaption(i)}>{track.label}</button>)}{!content.captions?.length && <p className="ca-panel-note">Este vídeo não possui legendas disponíveis.</p>}</div>}
            {panel === "episodes" && <><p className="ca-series-name">{media.title}</p><label className="ca-select-label">Temporada<select aria-label="Temporada" value={season} onChange={(e) => setSeason(Number(e.target.value))}>{(media.seasons ?? []).map((s) => <option key={s.number} value={s.number}>{s.title ?? `Temporada ${s.number}`}</option>)}</select></label><div className="ca-episode-list">{allEpisodes.filter((ep) => ep.season === season).map((ep) => <button type="button" key={ep.id} className={ep.id === episode?.id ? "is-current" : ""} aria-current={ep.id === episode?.id ? "true" : undefined} onClick={() => selectEpisode(ep)}><div className="ca-episode-image">{ep.poster && <img src={ep.poster} alt="" />}<Play size={19} /></div><div><small>{ep.id === episode?.id ? "EM REPRODUÇÃO" : `EPISÓDIO ${ep.number}`} · {ep.duration}</small><strong>{ep.title}</strong><p>{ep.synopsis}</p></div></button>)}</div></>}
          </aside>}
        </div>
        <div className="ca-perf-v" aria-hidden="true" />
      </div>
    </div>
  </dialog>;
}
