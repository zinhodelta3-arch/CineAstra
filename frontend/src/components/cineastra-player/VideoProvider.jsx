"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import VideoPlayer from "./VideoPlayer";
import { MEDIA, resolveMedia } from "../../lib/cineastra-media";
import "./player.css";

const VideoContext = createContext(null);
export const watchPath = (media) => `/streamming/assistir/${media.type === "series" ? "serie" : "filme"}/${encodeURIComponent(media.id)}`;

/** No Next, use CineAstraProvider (wrapper com router.push). */
export function VideoProvider({ children, navigate = (url) => window.location.assign(url) }) {
  const [active, setActive] = useState(null);
  const [mode, setMode] = useState("modal");
  const [episodeId, setEpisodeId] = useState(null);
  const [host, setHost] = useState(null);
  const [portalRoot, setPortalRoot] = useState(null);
  const cache = useRef({});
  const pendingOptions = useRef({});
  const portalRef = useRef(null);
  const modeRef = useRef(mode); modeRef.current = mode;
  const registerHost = useCallback((element) => setHost(element), []);
  useEffect(() => {
    const node = document.createElement("div");
    node.className = "ca-player-mount";
    document.body.appendChild(node); portalRef.current = node; setPortalRoot(node);
    return () => node.remove();
  }, []);
  // O alvo do portal nunca muda. Só seu contêiner é movido: o vídeo não reinicia.
  useLayoutEffect(() => {
    if (!portalRoot) return;
    const destination = mode === "page" && host?.isConnected && host.dataset.mediaId === active?.media.id ? host : document.body;
    if (portalRoot.parentElement !== destination) destination.appendChild(portalRoot);
  }, [portalRoot, host, mode, active?.media.id]);
  const getMedia = useCallback((id, type = "movie") => {
    if (cache.current[id]) return cache.current[id];
    if (MEDIA[id]) return MEDIA[id];
    try {
      const saved = JSON.parse(sessionStorage.getItem(`cineastra:media:${id}`) ?? "null");
      if (saved?.id === id) return saved;
    } catch { /* Dados locais opcionais. */ }
    return resolveMedia(id, type);
  }, []);
  const remember = useCallback((media) => {
    cache.current[media.id] = media;
    try { sessionStorage.setItem(`cineastra:media:${media.id}`, JSON.stringify(media)); } catch { /* opcional */ }
  }, []);
  const playVideo = useCallback((item, options = {}) => {
    const media = typeof item === "string" ? getMedia(item, options.type) : item;
    const requestedMode = options.mode ?? (media.type === "trailer" ? "modal" : "page");
    setMode(requestedMode);
    setActive((previous) => ({ media, options: previous?.media.id === media.id ? { ...previous.options, ...options } : options, session: previous?.media.id === media.id ? previous.session : `${Date.now()}-${Math.random()}` }));
  }, [getMedia]);
  const openVideo = useCallback((item, options = {}) => {
    const media = resolveMedia(item, options.type ?? item?.type ?? (item?.seasons ? "series" : "movie"));
    if (media.type === "trailer") { playVideo(media, { ...options, mode: "modal" }); return; }
    remember(media);
    pendingOptions.current[media.id] = options;
    try { sessionStorage.setItem(`cineastra:watch-options:${media.id}`, JSON.stringify(options)); } catch {}
    navigate(watchPath(media));
  }, [navigate, playVideo, remember]);
  const consumeWatchOptions = useCallback((id) => {
    let options = pendingOptions.current[id];
    delete pendingOptions.current[id];
    try {
      options ??= JSON.parse(sessionStorage.getItem(`cineastra:watch-options:${id}`) ?? "null");
      sessionStorage.removeItem(`cineastra:watch-options:${id}`);
    } catch {}
    return options ?? {};
  }, []);
  const closeVideo = useCallback(() => { setActive(null); setEpisodeId(null); }, []);
  const restoreVideo = useCallback(() => {
    if (!active) return;
    if (host?.isConnected && host.dataset.mediaId === active.media.id) setMode("page");
    else { setMode("page"); navigate(watchPath(active.media)); }
  }, [active, host, navigate]);
  const detachHost = useCallback((element) => {
    // Chamado no cleanup da página ANTES de o React retirar o contêiner.
    if (portalRef.current?.parentElement === element) document.body.appendChild(portalRef.current);
    setHost((previous) => previous === element ? null : previous);
    if (modeRef.current === "page") setMode("mini");
  }, []);
  useEffect(() => {
    const click = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target.closest?.("[data-cineastra-video]");
      if (!target || target.matches(":disabled, [aria-disabled='true']")) return;
      event.preventDefault();
      openVideo(target.dataset.cineastraVideo, target.dataset.videoType ? { type: target.dataset.videoType } : {});
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [openVideo]);
  const value = useMemo(() => ({ openVideo, playVideo, closeVideo, getMedia, consumeWatchOptions, registerHost, detachHost, restoreVideo, activeMedia: active?.media, playerMode: mode, episodeId, navigate }), [openVideo, playVideo, closeVideo, getMedia, consumeWatchOptions, registerHost, detachHost, restoreVideo, active, mode, episodeId, navigate]);
  return <VideoContext.Provider value={value}>
    {children}
    {portalRoot && active && createPortal(<VideoPlayer key={active.session} {...active} mode={mode} onModeChange={setMode} onRestore={restoreVideo} onEpisodeChange={setEpisodeId} onClose={closeVideo} />, portalRoot)}
  </VideoContext.Provider>;
}
export function useVideoPlayer() {
  const value = useContext(VideoContext);
  if (!value) throw new Error("Monte <CineAstraProvider> no layout principal.");
  return value;
}
export function VideoTrigger({ media, videoType, onClick, children, ...props }) {
  const { openVideo } = useVideoPlayer();
  return <button type="button" {...props} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) openVideo(media, videoType ? { type: videoType } : {}); }}>{children}</button>;
}
